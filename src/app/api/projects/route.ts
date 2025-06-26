import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            gpsPoints: true,
            activities: true,
          },
        },
        gpsPoints: {
          select: {
            phase: true,
            side: true,
            distance: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress statistics for each project
    const projectsWithStats = projects.map(project => {
      const gpsPoints = project.gpsPoints;

      // Calculate phase progress
      const phaseStats = {
        DRAIN: {
          left: gpsPoints
            .filter(p => p.phase === 'DRAIN' && p.side === 'LEFT')
            .reduce((sum, p) => sum + p.distance, 0),
          right: gpsPoints
            .filter(p => p.phase === 'DRAIN' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + p.distance, 0),
        },
        BASKET: {
          left: gpsPoints
            .filter(p => p.phase === 'BASKET' && p.side === 'LEFT')
            .reduce((sum, p) => sum + p.distance, 0),
          right: gpsPoints
            .filter(p => p.phase === 'BASKET' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + p.distance, 0),
        },
        SEALING: {
          left: gpsPoints
            .filter(p => p.phase === 'SEALING' && p.side === 'LEFT')
            .reduce((sum, p) => sum + p.distance, 0),
          right: gpsPoints
            .filter(p => p.phase === 'SEALING' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + p.distance, 0),
        },
      };

      // Calculate overall progress
      const totalCompleted = Object.values(phaseStats).reduce(
        (total, phase) => total + phase.left + phase.right,
        0
      );

      const totalExpected = project.totalDistance * 2 * 3; // 2 sides * 3 phases
      const overallProgress = (totalCompleted / totalExpected) * 100;

      return {
        ...project,
        stats: {
          phaseStats,
          totalCompleted,
          overallProgress: Math.min(overallProgress, 100),
          pointCounts: project._count,
        },
        gpsPoints: undefined, // Remove detailed GPS points from response
      };
    });

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
