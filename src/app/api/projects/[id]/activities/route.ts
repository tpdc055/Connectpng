import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Fetch project activities with full relations
    const projectActivities = await prisma.projectActivity.findMany({
      where: { projectId },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        tasks: {
          include: {
            assignedUser: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            activities: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      activities: projectActivities,
      count: projectActivities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Project activities fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch project activities',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 401 });
    }

    const projectId = params.id;
    const {
      activityId,
      assignedUserId,
      priority,
      estimatedHours,
      totalLength,
      notes
    } = await request.json();

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Check if activity already assigned to this project
    const existing = await prisma.projectActivity.findUnique({
      where: {
        projectId_activityId: {
          projectId,
          activityId
        }
      }
    });

    if (existing) {
      return NextResponse.json({
        error: 'Activity already assigned to this project'
      }, { status: 400 });
    }

    // Create project activity assignment
    const projectActivity = await prisma.projectActivity.create({
      data: {
        projectId,
        activityId,
        assignedUserId: assignedUserId || null,
        priority: priority || 'MEDIUM',
        estimatedHours: estimatedHours ? Number.parseFloat(estimatedHours) : null,
        totalLength: totalLength ? Number.parseFloat(totalLength) : null,
        notes: notes?.trim() || null,
        status: 'PLANNED'
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            tasks: true,
            activities: true
          }
        }
      }
    });

    // Log the assignment
    await prisma.activityLog.create({
      data: {
        type: 'ACTIVITY_ASSIGNED',
        description: `Assigned ${projectActivity.activity.name} to project`,
        userId: user.id,
        projectId,
        projectActivityId: projectActivity.id,
        metadata: JSON.stringify({
          activityName: projectActivity.activity.name,
          assignedTo: projectActivity.assignedUser?.name,
          priority: projectActivity.priority
        })
      }
    });

    console.log(`✅ Activity assigned to project: ${projectActivity.activity.name}`);

    return NextResponse.json({
      success: true,
      message: 'Activity assigned to project successfully',
      projectActivity,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Project activity assignment error:', error);
    return NextResponse.json({
      error: 'Failed to assign activity to project',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
