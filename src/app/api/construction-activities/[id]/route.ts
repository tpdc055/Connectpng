import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const activityId = params.id;

    // Check if activity exists
    const activity = await prisma.constructionActivity.findUnique({
      where: { id: activityId },
      include: {
        _count: {
          select: {
            projectActivities: true,
            gpsPoints: true,
            tasks: true
          }
        }
      }
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Check if activity is in use
    const totalUsage = activity._count.projectActivities + activity._count.gpsPoints + activity._count.tasks;

    if (totalUsage > 0) {
      return NextResponse.json({
        error: 'Cannot delete activity that is currently in use',
        details: {
          projectActivities: activity._count.projectActivities,
          gpsPoints: activity._count.gpsPoints,
          tasks: activity._count.tasks
        }
      }, { status: 400 });
    }

    // Delete the activity (cascade will handle related records)
    await prisma.constructionActivity.delete({
      where: { id: activityId }
    });

    // Log the deletion
    await prisma.activityLog.create({
      data: {
        type: 'ACTIVITY_DELETED',
        description: `Deleted construction activity: ${activity.name}`,
        userId: user.id,
        projectId: 'maria-pori-project', // Default project for logging
        metadata: JSON.stringify({
          deletedActivityId: activityId,
          deletedActivityName: activity.name,
          deletedBy: user.email
        })
      }
    });

    console.log(`✅ Construction activity deleted: ${activity.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Construction activity deleted successfully',
      deletedActivity: {
        id: activity.id,
        name: activity.name
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Construction activity deletion error:', error);
    return NextResponse.json({
      error: 'Failed to delete construction activity',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const activityId = params.id;
    const { name, description, color, isActive } = await request.json();

    // Check if activity exists
    const existingActivity = await prisma.constructionActivity.findUnique({
      where: { id: activityId }
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // Update the activity
    const updatedActivity = await prisma.constructionActivity.update({
      where: { id: activityId },
      data: {
        name: name?.trim() || existingActivity.name,
        description: description?.trim() || existingActivity.description,
        color: color || existingActivity.color,
        isActive: isActive !== undefined ? isActive : existingActivity.isActive,
        updatedAt: new Date()
      },
      include: {
        createdByUser: {
          select: { name: true, email: true }
        },
        _count: {
          select: {
            projectActivities: true,
            gpsPoints: true
          }
        }
      }
    });

    // Log the update
    await prisma.activityLog.create({
      data: {
        type: 'ACTIVITY_UPDATED',
        description: `Updated construction activity: ${updatedActivity.name}`,
        userId: user.id,
        projectId: 'maria-pori-project',
        metadata: JSON.stringify({
          activityId: updatedActivity.id,
          activityName: updatedActivity.name,
          updatedBy: user.email,
          changes: { name, description, color, isActive }
        })
      }
    });

    console.log(`✅ Construction activity updated: ${updatedActivity.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Construction activity updated successfully',
      activity: updatedActivity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Construction activity update error:', error);
    return NextResponse.json({
      error: 'Failed to update construction activity',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
