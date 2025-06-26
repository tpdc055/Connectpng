import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  SSEMessage,
  UseServerSentEventsOptions,
  PngNotificationData
} from '@/types';

export function useServerSentEvents(options: UseServerSentEventsOptions = {}) {
  const { token } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
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
      console.log('No token available for SSE connection');
      return;
    }

    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      console.log('SSE already connected');
      return;
    }

    try {
      setConnectionStatus('connecting');

      // Build SSE URL with authentication
      const params = new URLSearchParams({
        token,
        ...(projectId && { projectId })
      });

      const sseUrl = `/api/events?${params.toString()}`;
      console.log('🇵🇬 Connecting to PNG SSE:', sseUrl);

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('🇵🇬 PNG SSE connected to construction monitor');
        setConnectionStatus('connected');
        resetHeartbeatTimeout();
      };

      eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'CONNECTED':
              console.log('🔗 SSE connection established:', message.data);
              break;

            case 'GPS_POINT_ADDED':
              console.log('🛰️ New GPS point received:', message.data);
              onGpsPointAdded?.(message.data);
              showPngNotification({
                title: 'New GPS Point Added',
                message: message.data?.message || 'GPS point added to construction project',
                priority: 'info'
              });
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
              console.error('SSE error message:', message.data);
              onError?.(message.data);
              break;

            default:
              console.log('Unknown SSE message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnectionStatus('error');
        clearTimeout(heartbeatTimeoutRef.current);

        // Attempt to reconnect
        if (eventSource.readyState === EventSource.CLOSED) {
          scheduleReconnect();
        }

        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionStatus('error');
      onError?.(error);
    }
  }, [token, projectId, onGpsPointAdded, onActivityUpdate, onProjectUpdate, onPngNotification, onError]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    clearTimeout(heartbeatTimeoutRef.current);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  const scheduleReconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('Attempting to reconnect SSE...');
      connect();
    }, 5000); // Reconnect after 5 seconds
  }, [connect]);

  const resetHeartbeatTimeout = useCallback(() => {
    clearTimeout(heartbeatTimeoutRef.current);

    heartbeatTimeoutRef.current = setTimeout(() => {
      console.log('SSE heartbeat timeout - connection may be lost');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
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

  const sendMessage = useCallback(async (messageData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'broadcast_message',
          projectId,
          data: messageData,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Message sent via SSE:', result);
        return true;
      } else {
        console.error('Failed to send SSE message:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending SSE message:', error);
      return false;
    }
  }, [token, projectId]);

  const getConnectionStats = useCallback(async () => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'get_stats',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setConnectedUsers(result.stats?.totalConnections || 0);
        return result.stats;
      }
    } catch (error) {
      console.error('Error getting connection stats:', error);
    }
    return null;
  }, [token]);

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

  // Get connection stats periodically
  useEffect(() => {
    if (connectionStatus === 'connected') {
      getConnectionStats();

      const interval = setInterval(() => {
        getConnectionStats();
      }, 60000); // Update stats every minute

      return () => clearInterval(interval);
    }
  }, [connectionStatus, getConnectionStats]);

  return {
    connectionStatus,
    lastMessage,
    connectedUsers,
    connect,
    disconnect,
    sendMessage,
    getConnectionStats,
    isConnected: connectionStatus === 'connected',
  };
}
