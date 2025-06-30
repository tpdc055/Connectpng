import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const sectionId = url.searchParams.get('sectionId');
    const reportType = url.searchParams.get('reportType');
    const qaQcStatus = url.searchParams.get('qaQcStatus');
    const specCompliance = url.searchParams.get('specCompliance');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (sectionId) where.sectionId = sectionId;
    if (reportType) where.reportType = reportType;
    if (qaQcStatus) where.qaQcStatus = qaQcStatus;
    if (specCompliance) where.specCompliance = specCompliance;

    // Date filter
    if (startDate || endDate) {
      where.testDate = {};
      if (startDate) where.testDate.gte = new Date(startDate);
      if (endDate) where.testDate.lte = new Date(endDate);
    }

    const qualityReports = await prisma.qualityReport.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            province: true
          }
        },
        section: {
          select: {
            id: true,
            sectionName: true,
            startKm: true,
            endKm: true,
            length: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            position: true
          }
        }
      },
      orderBy: { testDate: 'desc' },
      take: limit
    });

    // Calculate quality statistics
    const stats = {
      total: qualityReports.length,
      passed: qualityReports.filter(r => r.qaQcStatus === 'PASS').length,
      failed: qualityReports.filter(r => r.qaQcStatus === 'FAIL').length,
      conditionalPass: qualityReports.filter(r => r.qaQcStatus === 'CONDITIONAL_PASS').length,
      reworkRequired: qualityReports.filter(r => r.qaQcStatus === 'REWORK_REQUIRED').length,
      passRate: qualityReports.length > 0 ? (qualityReports.filter(r => r.qaQcStatus === 'PASS').length / qualityReports.length) * 100 : 0,
      complianceBreakdown: {
        compliant: qualityReports.filter(r => r.specCompliance === 'COMPLIANT').length,
        nonCompliant: qualityReports.filter(r => r.specCompliance === 'NON_COMPLIANT').length,
        pending: qualityReports.filter(r => r.specCompliance === 'PENDING').length,
        rework: qualityReports.filter(r => r.specCompliance === 'REWORK_NEEDED').length
      },
      typeBreakdown: qualityReports.reduce((acc, report) => {
        acc[report.reportType] = (acc[report.reportType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Group reports by project section
    const reportsBySection = qualityReports.reduce((acc, report) => {
      const sectionId = report.sectionId || 'no-section';
      if (!acc[sectionId]) {
        acc[sectionId] = {
          section: report.section,
          reports: []
        };
      }
      acc[sectionId].reports.push(report);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      qualityReports,
      stats,
      reportsBySection,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching quality reports:', error);
    return NextResponse.json({
      error: 'Failed to fetch quality reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'QA_QC_OFFICER' && user.role !== 'SITE_ENGINEER' && user.role !== 'PROGRAM_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - QA/QC access required' }, { status: 401 });
    }

    const {
      projectId,
      sectionId,
      reportType,
      testDate,
      materialType,
      testResults,
      specCompliance,
      environmentalCompliance,
      socialCompliance,
      qaQcStatus,
      deficiencies,
      correctiveActions,
      inspectionFindings,
      recommendations,
      followUpRequired,
      followUpDate,
      testCertificates,
      photos,
      documents
    } = await request.json();

    // Validate required fields
    if (!projectId || !reportType || !testDate || !qaQcStatus) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, reportType, testDate, qaQcStatus'
      }, { status: 400 });
    }

    // Validate project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        userAccess: {
          where: { userId: user.id, isActive: true }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.userAccess.length === 0 && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied to this project' }, { status: 403 });
    }

    // Validate section if provided
    if (sectionId) {
      const section = await prisma.projectSection.findFirst({
        where: { id: sectionId, projectId }
      });
      if (!section) {
        return NextResponse.json({ error: 'Section not found or not part of project' }, { status: 400 });
      }
    }

    // Create quality report
    const qualityReport = await prisma.qualityReport.create({
      data: {
        projectId,
        sectionId: sectionId || null,
        reportType,
        testDate: new Date(testDate),
        reportedBy: user.id,
        materialType: materialType || null,
        testResults: testResults || {},
        specCompliance: specCompliance || 'PENDING',
        environmentalCompliance: environmentalCompliance || 'PENDING',
        socialCompliance: socialCompliance || 'PENDING',
        qaQcStatus,
        deficiencies: deficiencies || [],
        correctiveActions: correctiveActions || [],
        inspectionFindings: inspectionFindings || null,
        recommendations: recommendations || null,
        followUpRequired: followUpRequired || false,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        testCertificates: testCertificates || [],
        photos: photos || [],
        documents: documents || []
      },
      include: {
        project: {
          select: { name: true, projectCode: true }
        },
        section: {
          select: { sectionName: true, startKm: true, endKm: true }
        },
        user: {
          select: { name: true, role: true }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: user.id,
        activityType: 'QUALITY_REPORTED',
        category: 'Quality Assurance',
        description: `${reportType} quality report: ${qaQcStatus}${materialType ? ` for ${materialType}` : ''}`,
        metadata: {
          reportId: qualityReport.id,
          reportType,
          qaQcStatus,
          materialType,
          specCompliance
        }
      }
    });

    // Create follow-up activity if required
    if (followUpRequired && followUpDate) {
      await prisma.activity.create({
        data: {
          projectId,
          userId: user.id,
          activityType: 'QUALITY_REPORTED',
          category: 'Quality Follow-up',
          description: `Quality follow-up required by ${new Date(followUpDate).toLocaleDateString()}`,
          metadata: {
            reportId: qualityReport.id,
            followUpDate,
            qaQcStatus
          }
        }
      });
    }

    console.log(`🧪 Quality report created for project ${project.name} by ${user.name} - ${qaQcStatus}`);

    return NextResponse.json({
      success: true,
      message: 'Quality report created successfully',
      qualityReport,
      followUpScheduled: followUpRequired,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating quality report:', error);
    return NextResponse.json({
      error: 'Failed to create quality report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      id,
      testResults,
      specCompliance,
      environmentalCompliance,
      socialCompliance,
      qaQcStatus,
      deficiencies,
      correctiveActions,
      inspectionFindings,
      recommendations,
      followUpRequired,
      followUpDate,
      testCertificates,
      photos,
      documents
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Check if report exists
    const existingReport = await prisma.qualityReport.findUnique({
      where: { id },
      include: {
        project: true
      }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Quality report not found' }, { status: 404 });
    }

    // Check permissions (report creator, QA/QC officer, or admin can update)
    if (existingReport.reportedBy !== user.id &&
        user.role !== 'ADMIN' &&
        user.role !== 'QA_QC_OFFICER' &&
        user.role !== 'PROGRAM_MANAGER') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updatedReport = await prisma.qualityReport.update({
      where: { id },
      data: {
        ...(testResults !== undefined && { testResults }),
        ...(specCompliance !== undefined && { specCompliance }),
        ...(environmentalCompliance !== undefined && { environmentalCompliance }),
        ...(socialCompliance !== undefined && { socialCompliance }),
        ...(qaQcStatus !== undefined && { qaQcStatus }),
        ...(deficiencies !== undefined && { deficiencies }),
        ...(correctiveActions !== undefined && { correctiveActions }),
        ...(inspectionFindings !== undefined && { inspectionFindings }),
        ...(recommendations !== undefined && { recommendations }),
        ...(followUpRequired !== undefined && { followUpRequired }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(testCertificates !== undefined && { testCertificates }),
        ...(photos !== undefined && { photos }),
        ...(documents !== undefined && { documents })
      },
      include: {
        project: { select: { name: true, projectCode: true } },
        section: { select: { sectionName: true } },
        user: { select: { name: true, role: true } }
      }
    });

    // Create activity log for status change
    if (qaQcStatus && qaQcStatus !== existingReport.qaQcStatus) {
      await prisma.activity.create({
        data: {
          projectId: existingReport.projectId,
          userId: user.id,
          activityType: 'QUALITY_REPORTED',
          category: 'Quality Management',
          description: `Quality status updated: ${existingReport.qaQcStatus} → ${qaQcStatus}`,
          metadata: {
            reportId: id,
            previousStatus: existingReport.qaQcStatus,
            newStatus: qaQcStatus,
            updatedBy: user.name
          }
        }
      });
    }

    console.log(`✅ Quality report updated for project ${existingReport.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Quality report updated successfully',
      qualityReport: updatedReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating quality report:', error);
    return NextResponse.json({
      error: 'Failed to update quality report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'QA_QC_OFFICER')) {
      return NextResponse.json({ error: 'QA/QC Officer or Admin access required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Check if report exists
    const report = await prisma.qualityReport.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!report) {
      return NextResponse.json({ error: 'Quality report not found' }, { status: 404 });
    }

    await prisma.qualityReport.delete({
      where: { id }
    });

    console.log(`🗑️ Quality report deleted for project ${report.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Quality report deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting quality report:', error);
    return NextResponse.json({
      error: 'Failed to delete quality report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
