// WebSocket imports - only for development/custom hosting
// Vercel deployment uses Server-Sent Events instead
import type { IncomingMessage } from 'node:http';
import { verifyToken } from './auth';
import type { WebSocketMessage, GPSPoint, Activity, ProjectData } from '@/types';

// WebSocket interfaces - only for development/custom hosting
export interface WebSocketClient {
  ws: any; // WebSocket type for development only
  userId: string;
  projectId?: string;
  userRole: string;
}



class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private server?: any; // Server type for development only

  initialize(server: unknown) {
    // WebSocket server only for development/custom hosting
    // Vercel deployment uses Server-Sent Events (SSE) instead
    if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
      console.log('🇵🇬 PNG WebSocket Manager: Using SSE for production deployment');
    }
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage) {
    try {
      // Extract token from query parameters or headers
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      const payload = verifyToken(token);
      if (!payload) {
        ws.close(1008, 'Invalid token');
        return;
      }

      const clientId = `${payload.userId}-${Date.now()}`;
      const client: WebSocketClient = {
        ws,
        userId: payload.userId,
        userRole: payload.role,
      };

      this.clients.set(clientId, client);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'ACTIVITY_UPDATE',
        data: { message: 'Connected to PNG Road Construction Monitor' },
        timestamp: new Date().toISOString(),
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });

      console.log(`Client ${clientId} connected (User: ${payload.userId}, Role: ${payload.role})`);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private handleMessage(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'JOIN_PROJECT':
        client.projectId = message.projectId;
        this.clients.set(clientId, client);
        break;

      case 'LEAVE_PROJECT':
        client.projectId = undefined;
        this.clients.set(clientId, client);
        break;
    }
  }

  // Broadcast GPS point addition to all clients in the same project
  broadcastGpsPointAdded(gpsPoint: GPSPoint, projectId: string) {
    this.broadcastToProject(projectId, {
      type: 'GPS_POINT_ADDED',
      data: {
        gpsPoint,
        message: `New GPS point added for ${gpsPoint.phase} construction`,
      },
      timestamp: new Date().toISOString(),
      projectId,
      userId: gpsPoint.userId,
    });
  }

  // Broadcast activity updates
  broadcastActivity(activity: Activity, projectId: string) {
    this.broadcastToProject(projectId, {
      type: 'ACTIVITY_UPDATE',
      data: activity,
      timestamp: new Date().toISOString(),
      projectId,
      userId: activity.userId,
    });
  }

  // Broadcast project updates
  broadcastProjectUpdate(projectData: ProjectData, projectId: string) {
    this.broadcastToProject(projectId, {
      type: 'PROJECT_UPDATE',
      data: projectData,
      timestamp: new Date().toISOString(),
      projectId,
    });
  }

  // Send message to specific client (development only)
  sendToClient(clientId: string, message: WebSocketMessage) {
    if (process.env.NODE_ENV === 'development') {
      const client = this.clients.get(clientId);
      if (client && client.ws?.readyState === 1) { // WebSocket.OPEN = 1
        try {
          client.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message to client:', error);
          this.clients.delete(clientId);
        }
      }
    }
  }

  // Broadcast to all clients in a specific project
  broadcastToProject(projectId: string, message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Broadcast to all connected clients
  broadcast(message: WebSocketMessage) {
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Get connected clients count (development only)
  getConnectedClients(): number {
    if (process.env.NODE_ENV === 'development') {
      return Array.from(this.clients.values())
        .filter(client => client.ws?.readyState === 1).length; // WebSocket.OPEN = 1
    }
    return 0; // Production uses SSE instead
  }

  // Get clients by project (development only)
  getProjectClients(projectId: string): WebSocketClient[] {
    if (process.env.NODE_ENV === 'development') {
      return Array.from(this.clients.values())
        .filter(client =>
          client.projectId === projectId &&
          client.ws?.readyState === 1 // WebSocket.OPEN = 1
        );
    }
    return []; // Production uses SSE instead
  }
}

// Singleton instance
export const wsManager = new WebSocketManager();

// PNG-specific WebSocket messages for construction monitoring
export const PNG_WS_EVENTS = {
  GPS_POINT_ADDED: 'GPS_POINT_ADDED',
  CONSTRUCTION_UPDATE: 'CONSTRUCTION_UPDATE',
  PHASE_CHANGED: 'PHASE_CHANGED',
  WORKER_UPDATE: 'WORKER_UPDATE',
  BUDGET_UPDATE: 'BUDGET_UPDATE',
  PNG_NOTIFICATION: 'PNG_NOTIFICATION',
} as const;

export type PngWebSocketEvent = keyof typeof PNG_WS_EVENTS;
