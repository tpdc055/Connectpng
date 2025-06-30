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
    const limit = Number.parseInt(url.searchParams.get('limit') || '50');
    const offset = Number.parseInt(url.searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (projectId) {
      where.projectId = projectId;
    }

    // Fetch activities with related data
    const activities = await prisma.activity.findMany({
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        gpsPoint: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            phase: true,
            side: true,
            distance: true,
            status: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.activity.count({
      where,
    });

    // Parse metadata for each activity
    const activitiesWithParsedMetadata = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    return NextResponse.json({
      activities: activitiesWithParsedMetadata,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Server-Sent Events endpoint for real-time updates
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();

    // This is a simplified SSE implementation
    // In a production environment, you'd want to use a proper WebSocket or SSE library
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\\n\\n`;
        controller.enqueue(encoder.encode(data));

        // Set up a polling mechanism to check for new activities
        // In production, you'd use database triggers or a message queue
        const interval = setInterval(async () => {
          try {
            const recentActivities = await prisma.activity.findMany({
              where: {
                projectId,
                timestamp: {
                  gte: new Date(Date.now() - 10000), // Last 10 seconds
                },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    role: true,
                  },
                },
                gpsPoint: {
                  select: {
                    id: true,
                    phase: true,
                    side: true,
                    distance: true,
                  },
                },
              },
              orderBy: {
                timestamp: 'desc',
              },
            });

            if (recentActivities.length > 0) {
              const data = `data: ${JSON.stringify({
                type: 'activities',
                activities: recentActivities.map(activity => ({
                  ...activity,
                  metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
                })),
              })}\\n\\n`;
              controller.enqueue(encoder.encode(data));
            }
          } catch (error) {
            console.error('Error in SSE stream:', error);
          }
        }, 5000); // Check every 5 seconds

        // Clean up interval when client disconnects
        return () => {
          clearInterval(interval);
        };
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error setting up SSE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
