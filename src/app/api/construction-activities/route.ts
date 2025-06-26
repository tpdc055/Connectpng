import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active construction activities with counts
    const activities = await prisma.constructionActivity.findMany({
      where: { isActive: true },
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      activities,
      count: activities.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Construction activities fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch construction activities',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { name, description, color } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Activity name is required' }, { status: 400 });
    }

    // Check if activity name already exists
    const existing = await prisma.constructionActivity.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' },
        isActive: true
      }
    });

    if (existing) {
      return NextResponse.json({
        error: 'An activity with this name already exists'
      }, { status: 400 });
    }

    // Create the construction activity
    const activity = await prisma.constructionActivity.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        createdBy: user.id,
        isActive: true
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

    // Log the activity creation
    await prisma.activityLog.create({
      data: {
        type: 'ACTIVITY_CREATED',
        description: `Created new construction activity: ${name}`,
        userId: user.id,
        projectId: 'maria-pori-project', // Default project for now
        metadata: JSON.stringify({
          activityId: activity.id,
          activityName: name,
          description,
          color
        })
      }
    });

    console.log(`✅ Construction activity created: ${name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Construction activity created successfully',
      activity,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Construction activity creation error:', error);
    return NextResponse.json({
      error: 'Failed to create construction activity',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// For documentation/testing
export async function OPTIONS() {
  return NextResponse.json({
    message: 'Construction Activities API',
    description: 'Manage dynamic construction activities',
    endpoints: {
      'GET /api/construction-activities': 'List all active construction activities',
      'POST /api/construction-activities': 'Create new construction activity (Admin only)',
      'DELETE /api/construction-activities/[id]': 'Delete construction activity (Admin only)'
    },
    schema: {
      create: {
        name: 'string (required) - Activity name',
        description: 'string (optional) - Activity description',
        color: 'string (optional) - Hex color code, defaults to #3b82f6'
      }
    },
    examples: {
      linedrains: { name: 'Line Drain Construction', description: 'Installation of drainage systems', color: '#3b82f6' },
      bridges: { name: 'Bridge Construction', description: 'Building bridges and crossings', color: '#10b981' },
      roads: { name: 'Road Sealing', description: 'Final road surface sealing', color: '#ef4444' },
      custom: { name: 'Custom Activity', description: 'User-defined construction activity', color: '#8b5cf6' }
    }
  });
}
