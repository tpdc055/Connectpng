import { type NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import type { GPSPoint, Activity, PngNotificationData } from '@/types';

// Store active connections
const connections = new Map<string, {
  controller: ReadableStreamDefaultController;
  userId: string;
  projectId?: string;
  userRole: string;
}>();

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    const connectionId = `${user.id}-${Date.now()}`;

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        // Store connection
        connections.set(connectionId, {
          controller,
          userId: user.id,
          projectId: projectId || undefined,
          userRole: user.role,
        });

        // Send initial connection message
        const welcomeData = JSON.stringify({
          type: 'CONNECTED',
          data: {
            message: 'Connected to PNG Road Construction Monitor',
            connectionId,
            userId: user.id,
            userRole: user.role,
            projectId
          },
          timestamp: new Date().toISOString(),
        });

        controller.enqueue(`data: ${welcomeData}\n\n`);

        // Send periodic heartbeat
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeatData = JSON.stringify({
              type: 'HEARTBEAT',
              timestamp: new Date().toISOString(),
            });
            controller.enqueue(`data: ${heartbeatData}\n\n`);
          } catch (error) {
            console.error('Heartbeat error:', error);
            clearInterval(heartbeatInterval);
            connections.delete(connectionId);
          }
        }, 30000); // Every 30 seconds

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          connections.delete(connectionId);
          try {
            controller.close();
          } catch (error) {
            // Connection already closed
          }
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('SSE connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Broadcast message to all connections or specific project
export function broadcastToConnections(message: Record<string, unknown>, projectId?: string) {
  const messageData = JSON.stringify({
    ...message,
    timestamp: new Date().toISOString(),
  });

  connections.forEach((connection, connectionId) => {
    try {
      // Filter by project if specified
      if (projectId && connection.projectId !== projectId) {
        return;
      }

      connection.controller.enqueue(`data: ${messageData}\n\n`);
    } catch (error) {
      console.error('Error broadcasting to connection:', connectionId, error);
      connections.delete(connectionId);
    }
  });
}

// Broadcast GPS point addition
export function broadcastGpsPointAdded(gpsPoint: GPSPoint, projectId: string) {
  broadcastToConnections({
    type: 'GPS_POINT_ADDED',
    data: {
      gpsPoint,
      message: `New GPS point added for ${gpsPoint.phase} construction on ${gpsPoint.side} side`,
    },
    projectId,
    userId: gpsPoint.userId,
  }, projectId);
}

// Broadcast activity update
export function broadcastActivity(activity: Activity, projectId: string) {
  broadcastToConnections({
    type: 'ACTIVITY_UPDATE',
    data: activity,
    projectId,
    userId: activity.userId,
  }, projectId);
}

// Broadcast PNG-specific notifications
export function broadcastPngNotification(notification: PngNotificationData, projectId?: string) {
  broadcastToConnections({
    type: 'PNG_NOTIFICATION',
    data: {
      title: notification.title || 'PNG Construction Update',
      message: notification.message,
      priority: notification.priority || 'info',
      ...notification
    },
    projectId,
  }, projectId);
}

// Get connection stats
export function getConnectionStats() {
  const stats = {
    totalConnections: connections.size,
    projectConnections: {} as Record<string, number>,
    userRoles: {} as Record<string, number>,
  };

  for (const connection of connections.values()) {
    // Count by project
    if (connection.projectId) {
      stats.projectConnections[connection.projectId] =
        (stats.projectConnections[connection.projectId] || 0) + 1;
    }

    // Count by role
    stats.userRoles[connection.userRole] =
      (stats.userRoles[connection.userRole] || 0) + 1;
  }

  return stats;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, projectId, data } = await request.json();

    switch (action) {
      case 'broadcast_message':
        if (data) {
          broadcastPngNotification(data, projectId);
          return NextResponse.json({
            success: true,
            message: 'Message broadcasted',
            stats: getConnectionStats()
          });
        }
        break;

      case 'get_stats':
        return NextResponse.json({
          stats: getConnectionStats()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { error: 'Missing required parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('SSE POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
