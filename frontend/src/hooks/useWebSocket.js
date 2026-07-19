import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL || `ws://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3001`;

export function useWebSocket({ onMessage, onStatusUpdate, onPresence, onTyping, onDelete, ghost = false }) {
  const { user } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const reconnectDelay = useRef(1000);
  const ghostRef = useRef(ghost);
  ghostRef.current = ghost;

  const callbacksRef = useRef({ onMessage, onStatusUpdate, onPresence, onTyping, onDelete });
  callbacksRef.current = { onMessage, onStatusUpdate, onPresence, onTyping, onDelete };

  const connect = useCallback(async () => {
    if (!user) return;

    try {
      const tokenRes = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username: user.username }),
      });
      const { token } = await tokenRes.json();

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: 'auth',
          payload: { token, userId: user.id, username: user.username, publicKey: user.publicKey, ghost: ghostRef.current },
        }));
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'auth_success':
            setConnected(true);
            reconnectDelay.current = 1000;
            break;
          case 'auth_failed':
            setConnected(false);
            ws.close();
            break;
          case 'message':
            callbacksRef.current.onMessage?.(msg.payload);
            break;
          case 'status_update':
            callbacksRef.current.onStatusUpdate?.(msg.payload);
            break;
          case 'presence':
            callbacksRef.current.onPresence?.(msg.payload);
            break;
          case 'typing':
            callbacksRef.current.onTyping?.(msg.payload);
            break;
          case 'delete':
            callbacksRef.current.onDelete?.(msg.payload);
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection failed:', err);
      scheduleReconnect();
    }
  }, [user?.id]);

  function scheduleReconnect() {
    if (reconnectTimer.current) return;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
      connect();
    }, reconnectDelay.current);
  }

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendMessage = useCallback((payload) => {
    send({ type: 'message', payload });
  }, [send]);

  const sendTyping = useCallback((recipientId, isTyping) => {
    if (ghostRef.current) return;
    send({ type: 'typing', payload: { recipientId, isTyping } });
  }, [send]);

  const sendStatus = useCallback((recipientId, messageId, status) => {
    send({ type: 'status_update', payload: { recipientId, messageId, status } });
  }, [send]);

  const sendDelete = useCallback((messageId) => {
    send({ type: 'delete', payload: { messageId } });
  }, [send]);

  return { connected, sendMessage, sendTyping, sendStatus, sendDelete };
}