import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastGpsPointAdded, broadcastActivity } from '@/app/api/events/route';
import { ConstructionPhase, RoadSide, PointStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const phase = url.searchParams.get('phase') as ConstructionPhase | null;
    const projectId = url.searchParams.get('projectId');

    const where: Record<string, unknown> = {};
    if (phase) where.phase = phase;
    if (projectId) where.projectId = projectId;

    const gpsPoints = await prisma.gpsPoint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        photos: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            description: true,
            timestamp: true,
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json({ gpsPoints });
  } catch (error) {
    console.error('Error fetching GPS points:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      latitude,
      longitude,
      phase,
      side,
      distance,
      notes,
      projectId,
      elevation,
      accuracy,
    } = await request.json();

    // Validation
    if (!latitude || !longitude || !phase || !side || !distance || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate enums
    if (!Object.values(ConstructionPhase).includes(phase)) {
      return NextResponse.json(
        { error: 'Invalid construction phase' },
        { status: 400 }
      );
    }

    if (!Object.values(RoadSide).includes(side)) {
      return NextResponse.json(
        { error: 'Invalid road side' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Create GPS point
    const gpsPoint = await prisma.gpsPoint.create({
      data: {
        latitude: Number.parseFloat(latitude),
        longitude: Number.parseFloat(longitude),
        phase,
        side,
        distance: Number.parseFloat(distance),
        notes,
        elevation: elevation ? Number.parseFloat(elevation) : null,
        accuracy: accuracy ? Number.parseFloat(accuracy) : null,
        status: PointStatus.PENDING,
        userId: user.id,
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Create activity log
    const activity = await prisma.activity.create({
      data: {
        type: 'GPS_POINT_ADDED',
        description: `GPS point added for ${phase} construction on ${side} side (${distance}m)`,
        metadata: JSON.stringify({
          latitude: gpsPoint.latitude,
          longitude: gpsPoint.longitude,
          distance: gpsPoint.distance,
          phase: gpsPoint.phase,
          side: gpsPoint.side,
        }),
        userId: user.id,
        projectId,
        gpsPointId: gpsPoint.id,
      },
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
      },
    });

    // Broadcast real-time updates via Server-Sent Events
    try {
      broadcastGpsPointAdded(gpsPoint, projectId);
      broadcastActivity(activity, projectId);
    } catch (error) {
      console.error('SSE broadcast error:', error);
      // Don't fail the request if SSE broadcast fails
    }

    return NextResponse.json({ gpsPoint }, { status: 201 });
  } catch (error) {
    console.error('Error creating GPS point:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
