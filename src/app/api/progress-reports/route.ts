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
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build where clause
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (sectionId) where.sectionId = sectionId;
    if (reportType) where.reportType = reportType;
    if (startDate || endDate) {
      where.reportDate = {};
      if (startDate) where.reportDate.gte = new Date(startDate);
      if (endDate) where.reportDate.lte = new Date(endDate);
    }

    const progressReports = await prisma.progressReport.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            province: true,
            totalLength: true
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
      orderBy: { reportDate: 'desc' },
      take: limit
    });

    // Calculate summary statistics
    const summary = await prisma.progressReport.aggregate({
      where,
      _avg: {
        currentProgress: true,
        progressDelta: true,
        plannedProgress: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      progressReports,
      summary: {
        totalReports: summary._count.id,
        avgCurrentProgress: summary._avg.currentProgress || 0,
        avgProgressDelta: summary._avg.progressDelta || 0,
        avgPlannedProgress: summary._avg.plannedProgress || 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching progress reports:', error);
    return NextResponse.json({
      error: 'Failed to fetch progress reports',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      projectId,
      sectionId,
      reportType,
      reportDate,
      previousProgress,
      currentProgress,
      worksCompleted,
      plannedProgress,
      scheduleStatus,
      delayReason,
      beforePhotos,
      duringPhotos,
      afterPhotos,
      weatherConditions,
      siteConditions,
      notes,
      // Connect PNG specific fields
      materialTesting,
      qualityIssues,
      safetyIncidents,
      communityIssues,
      environmentalIssues,
      contractorPerformance,
      equipmentStatus,
      manpowerStatus
    } = await request.json();

    // Validate required fields
    if (!projectId || !reportType || !reportDate || currentProgress === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, reportType, reportDate, currentProgress'
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

    // Calculate progress delta
    const progressDelta = currentProgress - (previousProgress || 0);

    // Determine schedule status if not provided
    let calculatedScheduleStatus = scheduleStatus;
    if (!calculatedScheduleStatus && plannedProgress !== undefined) {
      const variance = currentProgress - plannedProgress;
      if (variance < -5) calculatedScheduleStatus = 'BEHIND';
      else if (variance > 5) calculatedScheduleStatus = 'AHEAD';
      else calculatedScheduleStatus = 'ON_TRACK';
    }

    // Create progress report
    const progressReport = await prisma.progressReport.create({
      data: {
        projectId,
        sectionId: sectionId || null,
        reportType,
        reportDate: new Date(reportDate),
        reportedBy: user.id,
        previousProgress: previousProgress || 0,
        currentProgress,
        progressDelta,
        worksCompleted: worksCompleted || [],
        plannedProgress: plannedProgress || currentProgress,
        scheduleStatus: calculatedScheduleStatus || 'ON_TRACK',
        delayReason: delayReason || null,
        beforePhotos: beforePhotos || [],
        duringPhotos: duringPhotos || [],
        afterPhotos: afterPhotos || [],
        weatherConditions: weatherConditions || null,
        siteConditions: siteConditions || null,
        notes: notes || null
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

    // Update section progress if section is specified
    if (sectionId) {
      await prisma.projectSection.update({
        where: { id: sectionId },
        data: {
          actualProgress: currentProgress,
          status: currentProgress >= 100 ? 'COMPLETED' :
                 currentProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
        }
      });
    }

    // Update overall project progress (average of all sections or latest report)
    const allSectionProgress = await prisma.projectSection.findMany({
      where: { projectId },
      select: { actualProgress: true, length: true }
    });

    if (allSectionProgress.length > 0) {
      // Weighted average by section length
      const totalLength = allSectionProgress.reduce((sum, s) => sum + s.length, 0);
      const weightedProgress = allSectionProgress.reduce((sum, s) =>
        sum + (s.actualProgress * s.length), 0) / totalLength;

      await prisma.project.update({
        where: { id: projectId },
        data: { overallProgress: Math.round(weightedProgress * 100) / 100 }
      });
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: user.id,
        activityType: 'PROGRESS_REPORTED',
        category: 'Progress Tracking',
        description: `${reportType} progress report: ${currentProgress}% complete`,
        metadata: {
          reportId: progressReport.id,
          progressDelta,
          scheduleStatus: calculatedScheduleStatus
        }
      }
    });

    console.log(`✅ Progress report created for project ${project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Progress report created successfully',
      progressReport,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating progress report:', error);
    return NextResponse.json({
      error: 'Failed to create progress report',
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
      currentProgress,
      worksCompleted,
      plannedProgress,
      scheduleStatus,
      delayReason,
      weatherConditions,
      siteConditions,
      notes
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Check if report exists and user has permission
    const existingReport = await prisma.progressReport.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            userAccess: {
              where: { userId: user.id, isActive: true }
            }
          }
        }
      }
    });

    if (!existingReport) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    if (existingReport.reportedBy !== user.id &&
        existingReport.project.userAccess.length === 0 &&
        user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Calculate new progress delta if currentProgress is updated
    const progressDelta = currentProgress !== undefined ?
      currentProgress - existingReport.previousProgress : existingReport.progressDelta;

    const updatedReport = await prisma.progressReport.update({
      where: { id },
      data: {
        ...(currentProgress !== undefined && { currentProgress, progressDelta }),
        ...(worksCompleted !== undefined && { worksCompleted }),
        ...(plannedProgress !== undefined && { plannedProgress }),
        ...(scheduleStatus !== undefined && { scheduleStatus }),
        ...(delayReason !== undefined && { delayReason }),
        ...(weatherConditions !== undefined && { weatherConditions }),
        ...(siteConditions !== undefined && { siteConditions }),
        ...(notes !== undefined && { notes })
      },
      include: {
        project: { select: { name: true, projectCode: true } },
        section: { select: { sectionName: true } },
        user: { select: { name: true, role: true } }
      }
    });

    console.log(`✅ Progress report updated for project ${existingReport.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Progress report updated successfully',
      progressReport: updatedReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating progress report:', error);
    return NextResponse.json({
      error: 'Failed to update progress report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Check permissions
    const report = await prisma.progressReport.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!report) {
      return NextResponse.json({ error: 'Progress report not found' }, { status: 404 });
    }

    if (report.reportedBy !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await prisma.progressReport.delete({
      where: { id }
    });

    console.log(`✅ Progress report deleted for project ${report.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Progress report deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting progress report:', error);
    return NextResponse.json({
      error: 'Failed to delete progress report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
