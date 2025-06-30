import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    console.log('🧹 Starting data cleanup to reflect current users...');

    // Get the current admin (Emmanuel Mabi)
    const currentAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true }
    });

    if (!currentAdmin) {
      return NextResponse.json({ error: 'No active admin found' }, { status: 404 });
    }

    // Get or create the Maria Pori Road project
    const project = await prisma.project.upsert({
      where: { id: 'maria-pori-project' },
      update: {
        name: 'Maria Pori Road Construction',
        description: '15km road construction project connecting remote communities in Central Province, Papua New Guinea.',
        sponsor: 'ITCFA - Exxon Mobile',
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-04-15'),
        totalDistance: 15000,
        teamLead: currentAdmin.name, // Set current admin as team lead
        status: 'IN_PROGRESS'
      },
      create: {
        id: 'maria-pori-project',
        name: 'Maria Pori Road Construction',
        description: '15km road construction project connecting remote communities in Central Province, Papua New Guinea.',
        sponsor: 'ITCFA - Exxon Mobile',
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-04-15'),
        totalDistance: 15000,
        teamLead: currentAdmin.name,
        status: 'IN_PROGRESS'
      }
    });

    // Create realistic construction phases for Central Province
    const phases = [
      {
        id: 'line-drain-construction',
        name: 'Line Drain Construction',
        description: 'Installation of drainage systems along both sides of Maria Pori Road',
        projectId: project.id,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-04-15'),
        status: 'IN_PROGRESS',
        progress: 40, // 40% complete as shown in screenshot
        totalLength: 15000, // 15km
        completedLength: 6000, // 6km completed
        assignedUserId: currentAdmin.id
      }
    ];

    for (const phase of phases) {
      await prisma.constructionPhase.upsert({
        where: { id: phase.id },
        update: {
          ...phase,
          assignedUserId: currentAdmin.id
        },
        create: phase
      });
    }

    // Create task breakdown with current user assignments
    const tasks = [
      {
        id: 'left-side-drainage',
        name: 'Left side drainage',
        description: 'Complete drainage installation on left side of road',
        phaseId: 'line-drain-construction',
        assignedUserId: currentAdmin.id,
        status: 'IN_PROGRESS',
        progress: 60,
        estimatedHours: 200,
        completedHours: 120
      },
      {
        id: 'right-side-drainage',
        name: 'Right side drainage',
        description: 'Complete drainage installation on right side of road',
        phaseId: 'line-drain-construction',
        assignedUserId: currentAdmin.id,
        status: 'IN_PROGRESS',
        progress: 35,
        estimatedHours: 200,
        completedHours: 70
      }
    ];

    for (const task of tasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: {
          ...task,
          assignedUserId: currentAdmin.id
        },
        create: task
      });
    }

    // Update any existing GPS points to be associated with current admin
    await prisma.gpsPoint.updateMany({
      where: { projectId: project.id },
      data: { userId: currentAdmin.id }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'DATA_CLEANUP',
        description: `Updated project data to reflect current team. Team Lead: ${currentAdmin.name}`,
        metadata: JSON.stringify({
          oldTeamLead: 'Demo Data (John Kila)',
          newTeamLead: currentAdmin.name,
          updatedBy: currentAdmin.email,
          timestamp: new Date().toISOString()
        }),
        userId: currentAdmin.id,
        projectId: project.id
      }
    });

    console.log('✅ Data cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Data updated to reflect current users',
      updates: {
        projectTeamLead: currentAdmin.name,
        phasesUpdated: phases.length,
        tasksUpdated: tasks.length,
        currentAdmin: {
          name: currentAdmin.name,
          email: currentAdmin.email,
          role: currentAdmin.role
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Data cleanup failed:', error);
    return NextResponse.json({
      error: 'Data cleanup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Data Cleanup API',
    description: 'Updates demo data to reflect current system users',
    usage: 'POST to run cleanup (Admin access required)',
    note: 'This will update team leads, assignments, and user references'
  });
}
