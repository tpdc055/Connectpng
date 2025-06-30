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
    const hseRecordId = url.searchParams.get('hseRecordId');
    const incidentType = url.searchParams.get('incidentType');
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Build where clause for incidents
    const where: any = {};
    if (hseRecordId) where.hseRecordId = hseRecordId;
    if (incidentType) where.incidentType = incidentType;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    // Date filter
    if (startDate || endDate) {
      where.incidentDate = {};
      if (startDate) where.incidentDate.gte = new Date(startDate);
      if (endDate) where.incidentDate.lte = new Date(endDate);
    }

    // Project filter through HSE record
    if (projectId) {
      where.hseRecord = {
        projectId: projectId
      };
    }

    const incidents = await prisma.hSEIncident.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            position: true
          }
        },
        hseRecord: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
                province: true
              }
            }
          }
        }
      },
      orderBy: { incidentDate: 'desc' },
      take: limit
    });

    // Calculate incident statistics
    const stats = {
      total: incidents.length,
      reported: incidents.filter(i => i.status === 'REPORTED').length,
      investigating: incidents.filter(i => i.status === 'INVESTIGATING').length,
      resolved: incidents.filter(i => i.status === 'RESOLVED').length,
      closed: incidents.filter(i => i.status === 'CLOSED').length,
      severityBreakdown: {
        low: incidents.filter(i => i.severity === 'LOW').length,
        medium: incidents.filter(i => i.severity === 'MEDIUM').length,
        high: incidents.filter(i => i.severity === 'HIGH').length,
        critical: incidents.filter(i => i.severity === 'CRITICAL').length
      },
      typeBreakdown: incidents.reduce((acc, incident) => {
        acc[incident.incidentType] = (acc[incident.incidentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Group incidents by project if multiple projects
    const incidentsByProject = incidents.reduce((acc, incident) => {
      const projectId = incident.hseRecord.project.id;
      if (!acc[projectId]) {
        acc[projectId] = {
          project: incident.hseRecord.project,
          incidents: []
        };
      }
      acc[projectId].incidents.push(incident);
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      incidents,
      stats,
      incidentsByProject,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching HSE incidents:', error);
    return NextResponse.json({
      error: 'Failed to fetch HSE incidents',
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
      incidentType,
      severity,
      description,
      incidentDate,
      location,
      personsInvolved,
      rootCause,
      investigation,
      preventiveMeasures,
      status,
      attachments
    } = await request.json();

    // Validate required fields
    if (!projectId || !incidentType || !severity || !description || !incidentDate || !location) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, incidentType, severity, description, incidentDate, location'
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

    // Find or create HSE record for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hseRecord = await prisma.hSERecord.findFirst({
      where: {
        projectId,
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        recordType: 'INCIDENT'
      }
    });

    if (!hseRecord) {
      hseRecord = await prisma.hSERecord.create({
        data: {
          projectId,
          recordType: 'INCIDENT',
          date: new Date(),
          safetyIncidents: 1,
          hseCompliance: 'NON_COMPLIANT', // Any incident makes the day non-compliant
          notes: 'HSE Record created automatically for incident reporting'
        }
      });
    } else {
      // Update incident count
      await prisma.hSERecord.update({
        where: { id: hseRecord.id },
        data: {
          safetyIncidents: { increment: 1 },
          hseCompliance: 'NON_COMPLIANT' // Any incident makes the day non-compliant
        }
      });
    }

    // Create HSE incident
    const incident = await prisma.hSEIncident.create({
      data: {
        hseRecordId: hseRecord.id,
        reportedBy: user.id,
        incidentType,
        severity,
        description,
        incidentDate: new Date(incidentDate),
        location,
        personsInvolved: personsInvolved || [],
        rootCause: rootCause || null,
        investigation: investigation || null,
        preventiveMeasures: preventiveMeasures || [],
        status: status || 'REPORTED'
      },
      include: {
        user: {
          select: { name: true, role: true, position: true }
        },
        hseRecord: {
          include: {
            project: {
              select: { name: true, projectCode: true }
            }
          }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: user.id,
        activityType: 'INCIDENT_REPORTED',
        category: 'Health & Safety',
        description: `${incidentType} incident reported: ${severity} severity`,
        metadata: {
          incidentId: incident.id,
          incidentType,
          severity,
          location
        }
      }
    });

    // If high or critical severity, create additional notifications/escalations
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      // Log escalation requirement
      await prisma.activity.create({
        data: {
          projectId,
          userId: user.id,
          activityType: 'INCIDENT_REPORTED',
          category: 'Safety Escalation',
          description: `${severity} severity incident requires immediate management attention`,
          metadata: {
            incidentId: incident.id,
            escalationRequired: true,
            severity
          }
        }
      });
    }

    console.log(`🚨 HSE incident reported for project ${project.name} by ${user.name} - ${severity} severity`);

    return NextResponse.json({
      success: true,
      message: 'HSE incident reported successfully',
      incident,
      escalationRequired: severity === 'HIGH' || severity === 'CRITICAL',
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error reporting HSE incident:', error);
    return NextResponse.json({
      error: 'Failed to report HSE incident',
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
      rootCause,
      investigation,
      preventiveMeasures,
      status,
      closureDate,
      attachments
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    // Check if incident exists
    const existingIncident = await prisma.hSEIncident.findUnique({
      where: { id },
      include: {
        hseRecord: {
          include: { project: true }
        }
      }
    });

    if (!existingIncident) {
      return NextResponse.json({ error: 'HSE incident not found' }, { status: 404 });
    }

    // Check permissions (incident reporter, HSE officer, or admin can update)
    if (existingIncident.reportedBy !== user.id &&
        user.role !== 'ADMIN' &&
        user.role !== 'HSE_OFFICER' &&
        user.role !== 'PROGRAM_MANAGER') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const updatedIncident = await prisma.hSEIncident.update({
      where: { id },
      data: {
        ...(rootCause !== undefined && { rootCause }),
        ...(investigation !== undefined && { investigation }),
        ...(preventiveMeasures !== undefined && { preventiveMeasures }),
        ...(status !== undefined && { status }),
        ...(closureDate !== undefined && { closureDate: closureDate ? new Date(closureDate) : null })
      },
      include: {
        user: { select: { name: true, role: true } },
        hseRecord: {
          include: {
            project: { select: { name: true, projectCode: true } }
          }
        }
      }
    });

    // Create activity log for status change
    if (status && status !== existingIncident.status) {
      await prisma.activity.create({
        data: {
          projectId: existingIncident.hseRecord.projectId,
          userId: user.id,
          activityType: 'INCIDENT_REPORTED',
          category: 'Safety Management',
          description: `HSE incident status updated: ${existingIncident.status} → ${status}`,
          metadata: {
            incidentId: id,
            previousStatus: existingIncident.status,
            newStatus: status,
            updatedBy: user.name
          }
        }
      });
    }

    console.log(`✅ HSE incident updated for project ${existingIncident.hseRecord.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'HSE incident updated successfully',
      incident: updatedIncident,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating HSE incident:', error);
    return NextResponse.json({
      error: 'Failed to update HSE incident',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'HSE_OFFICER')) {
      return NextResponse.json({ error: 'HSE Officer or Admin access required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Incident ID is required' }, { status: 400 });
    }

    // Check if incident exists
    const incident = await prisma.hSEIncident.findUnique({
      where: { id },
      include: {
        hseRecord: {
          include: { project: true }
        }
      }
    });

    if (!incident) {
      return NextResponse.json({ error: 'HSE incident not found' }, { status: 404 });
    }

    await prisma.hSEIncident.delete({
      where: { id }
    });

    // Update HSE record incident count
    await prisma.hSERecord.update({
      where: { id: incident.hseRecordId },
      data: {
        safetyIncidents: { decrement: 1 }
      }
    });

    console.log(`🗑️ HSE incident deleted for project ${incident.hseRecord.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'HSE incident deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting HSE incident:', error);
    return NextResponse.json({
      error: 'Failed to delete HSE incident',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
