import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  WebSocketMessage,
  UseWebSocketOptions,
  PngNotificationData
} from '@/types';

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    projectId,
    onGpsPointAdded,
    onActivityUpdate,
    onProjectUpdate,
    onPngNotification,
    onError
  } = options;

  const connect = useCallback(() => {
    if (!token) {
      console.log('No token available for WebSocket connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Create WebSocket connection with authentication
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/websocket?token=${encodeURIComponent(token)}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🇵🇬 PNG WebSocket connected to construction monitor');
        setConnectionStatus('connected');

        // Join project if specified
        if (projectId) {
          wsRef.current?.send(JSON.stringify({
            type: 'JOIN_PROJECT',
            projectId,
          }));
        }

        // Reset heartbeat timeout
        resetHeartbeatTimeout();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'GPS_POINT_ADDED':
              console.log('🛰️ New GPS point received:', message.data);
              onGpsPointAdded?.(message.data);
              break;

            case 'ACTIVITY_UPDATE':
              console.log('📢 Activity update received:', message.data);
              onActivityUpdate?.(message.data);
              break;

            case 'PROJECT_UPDATE':
              console.log('📊 Project update received:', message.data);
              onProjectUpdate?.(message.data);
              break;

            case 'PNG_NOTIFICATION':
              console.log('🇵🇬 PNG notification received:', message.data);
              onPngNotification?.(message.data);
              showPngNotification(message.data);
              break;

            case 'HEARTBEAT':
              // Reset heartbeat timeout on each heartbeat
              resetHeartbeatTimeout();
              break;

            case 'ERROR':
              console.error('WebSocket error message:', message.data);
              onError?.(message.data);
              break;

            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        clearTimeout(heartbeatTimeoutRef.current);

        // Attempt to reconnect after a delay (unless explicitly closed)
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      onError?.(error);
    }
  }, [token, projectId, onGpsPointAdded, onActivityUpdate, onProjectUpdate, onPngNotification, onError]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    clearTimeout(heartbeatTimeoutRef.current);

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connect();
    }, 5000); // Reconnect after 5 seconds
  }, [connect]);

  const resetHeartbeatTimeout = useCallback(() => {
    clearTimeout(heartbeatTimeoutRef.current);

    heartbeatTimeoutRef.current = setTimeout(() => {
      console.log('WebSocket heartbeat timeout - connection may be lost');
      if (wsRef.current) {
        wsRef.current.close();
      }
    }, 45000); // Expect heartbeat every 30 seconds, timeout after 45
  }, []);

  const showPngNotification = (data: PngNotificationData) => {
    // Show PNG-themed notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🇵🇬 ${data.title || 'PNG Construction Update'}`, {
        body: data.message,
        icon: '/png-flag-icon.png', // You can add this icon
        badge: '/png-badge.png',
        tag: 'png-construction',
      });
    }
  };

  const sendMessage = useCallback((message: Partial<WebSocketMessage>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket not connected, cannot send message');
    return false;
  }, []);

  const joinProject = useCallback((newProjectId: string) => {
    sendMessage({
      type: 'JOIN_PROJECT',
      projectId: newProjectId,
    });
  }, [sendMessage]);

  const leaveProject = useCallback(() => {
    sendMessage({
      type: 'LEAVE_PROJECT',
    });
  }, [sendMessage]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect when component mounts and token is available
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Handle project changes
  useEffect(() => {
    if (connectionStatus === 'connected' && projectId) {
      joinProject(projectId);
    }
  }, [connectionStatus, projectId, joinProject]);

  return {
    connectionStatus,
    lastMessage,
    connectedUsers,
    connect,
    disconnect,
    sendMessage,
    joinProject,
    leaveProject,
    isConnected: connectionStatus === 'connected',
  };
}
