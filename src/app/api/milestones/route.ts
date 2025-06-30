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
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    // Build where clause
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (status) where.status = status;

    const milestones = await prisma.projectMilestone.findMany({
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
        updates: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { plannedDate: 'asc' }
    });

    // Calculate milestone statistics
    const stats = {
      total: milestones.length,
      notStarted: milestones.filter(m => m.status === 'NOT_STARTED').length,
      inProgress: milestones.filter(m => m.status === 'IN_PROGRESS').length,
      completed: milestones.filter(m => m.status === 'COMPLETED').length,
      delayed: milestones.filter(m => m.status === 'DELAYED').length,
      completionRate: milestones.length > 0 ? (milestones.filter(m => m.status === 'COMPLETED').length / milestones.length) * 100 : 0
    };

    // Group milestones by category
    const milestonesByCategory = milestones.reduce((acc, milestone) => {
      const category = milestone.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(milestone);
      return acc;
    }, {} as Record<string, typeof milestones>);

    return NextResponse.json({
      milestones,
      stats,
      milestonesByCategory,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({
      error: 'Failed to fetch milestones',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'PROGRAM_MANAGER' && user.role !== 'PROJECT_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - Project management access required' }, { status: 401 });
    }

    const {
      projectId,
      milestoneName,
      description,
      category,
      plannedDate,
      actualDate,
      status
    } = await request.json();

    // Validate required fields
    if (!projectId || !milestoneName || !category || !plannedDate) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, milestoneName, category, plannedDate'
      }, { status: 400 });
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Create milestone
    const milestone = await prisma.projectMilestone.create({
      data: {
        projectId,
        milestoneName: milestoneName.trim(),
        description: description?.trim() || null,
        category,
        plannedDate: new Date(plannedDate),
        actualDate: actualDate ? new Date(actualDate) : null,
        status: status || 'NOT_STARTED'
      },
      include: {
        project: {
          select: { name: true, projectCode: true }
        }
      }
    });

    // Create initial milestone update
    await prisma.milestoneUpdate.create({
      data: {
        milestoneId: milestone.id,
        updatedBy: user.id,
        previousStatus: 'NOT_STARTED',
        newStatus: milestone.status,
        notes: `Milestone created: ${milestoneName}`
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: user.id,
        activityType: 'MILESTONE_UPDATED',
        category: 'Milestone Management',
        description: `Milestone created: ${milestoneName}`,
        metadata: {
          milestoneId: milestone.id,
          category: milestone.category,
          plannedDate: milestone.plannedDate
        }
      }
    });

    console.log(`✅ Milestone created for project ${project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Milestone created successfully',
      milestone,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating milestone:', error);
    return NextResponse.json({
      error: 'Failed to create milestone',
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
      milestoneName,
      description,
      plannedDate,
      actualDate,
      status,
      updateNotes
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Check if milestone exists
    const existingMilestone = await prisma.projectMilestone.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Check permissions for status updates
    if (status && status !== existingMilestone.status) {
      if (user.role !== 'ADMIN' && user.role !== 'PROGRAM_MANAGER' && user.role !== 'PROJECT_MANAGER') {
        return NextResponse.json({ error: 'Insufficient permissions to update milestone status' }, { status: 403 });
      }
    }

    const updatedMilestone = await prisma.projectMilestone.update({
      where: { id },
      data: {
        ...(milestoneName && { milestoneName: milestoneName.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(plannedDate && { plannedDate: new Date(plannedDate) }),
        ...(actualDate !== undefined && { actualDate: actualDate ? new Date(actualDate) : null }),
        ...(status && { status })
      },
      include: {
        project: { select: { name: true, projectCode: true } }
      }
    });

    // Create milestone update record if status changed
    if (status && status !== existingMilestone.status) {
      await prisma.milestoneUpdate.create({
        data: {
          milestoneId: id,
          updatedBy: user.id,
          previousStatus: existingMilestone.status,
          newStatus: status,
          notes: updateNotes || `Status updated from ${existingMilestone.status} to ${status}`
        }
      });

      // Create activity log for status change
      await prisma.activity.create({
        data: {
          projectId: existingMilestone.projectId,
          userId: user.id,
          activityType: 'MILESTONE_UPDATED',
          category: 'Milestone Management',
          description: `Milestone "${existingMilestone.milestoneName}" status: ${existingMilestone.status} → ${status}`,
          metadata: {
            milestoneId: id,
            previousStatus: existingMilestone.status,
            newStatus: status
          }
        }
      });
    }

    console.log(`✅ Milestone updated for project ${existingMilestone.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Milestone updated successfully',
      milestone: updatedMilestone,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating milestone:', error);
    return NextResponse.json({
      error: 'Failed to update milestone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Milestone ID is required' }, { status: 400 });
    }

    // Check if milestone exists
    const milestone = await prisma.projectMilestone.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    // Delete milestone updates first
    await prisma.milestoneUpdate.deleteMany({
      where: { milestoneId: id }
    });

    // Delete milestone
    await prisma.projectMilestone.delete({
      where: { id }
    });

    console.log(`✅ Milestone deleted for project ${milestone.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json({
      error: 'Failed to delete milestone',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
