import { type NextRequest, NextResponse } from 'next/server';
import { wsManager } from '@/lib/websocket';

export async function GET(request: NextRequest) {
  try {
    // Get WebSocket connection stats
    const connectedClients = wsManager.getConnectedClients();

    return NextResponse.json({
      message: 'PNG Road Construction Monitor WebSocket Service',
      connectedClients,
      status: 'active',
      features: [
        'Real-time GPS point updates',
        'Live construction activity feed',
        'Project progress broadcasting',
        'PNG-specific notifications'
      ]
    });
  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json(
      { error: 'WebSocket service error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, projectId, data } = await request.json();

    switch (action) {
      case 'broadcast_message':
        if (projectId && data) {
          wsManager.broadcastToProject(projectId, {
            type: 'PNG_NOTIFICATION',
            data: {
              message: data.message,
              title: data.title || 'PNG Construction Update',
              priority: data.priority || 'info'
            },
            timestamp: new Date().toISOString(),
            projectId,
          });

          return NextResponse.json({
            success: true,
            message: 'Message broadcasted to project clients',
            recipientCount: wsManager.getProjectClients(projectId).length
          });
        }
        break;

      case 'get_project_clients':
        if (projectId) {
          const clients = wsManager.getProjectClients(projectId);
          return NextResponse.json({
            projectId,
            clientCount: clients.length,
            clients: clients.map(client => ({
              userId: client.userId,
              userRole: client.userRole,
            }))
          });
        }
        break;

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
    console.error('WebSocket POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
