import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { AuthProvider, useAuth } from '../context/AuthContext';

class MockWebSocket {
  static OPEN = 1;
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    MockWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen && this.onopen();
    });
  }
  send(data) {
    this.sent.push(data);
    let parsed;
    try { parsed = JSON.parse(data); } catch { return; }
    if (parsed.type === 'auth') {
      queueMicrotask(() => this.push({ type: 'auth_success', userId: parsed.payload.userId }));
    }
  }
  close() {
    this.readyState = 3;
    this.onclose && this.onclose();
  }
  push(data) {
    this.onmessage && this.onmessage({ data: JSON.stringify(data) });
  }
}

function lastSentParsed(ws) {
  return JSON.parse(ws.sent[ws.sent.length - 1]);
}

function SeededAuth({ children }) {
  const { signIn } = useAuth();
  useEffect(() => {
    signIn({ id: 'u1', username: 'tester', publicKey: 'x' }, null);
  }, [signIn]);
  return children;
}

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.instances = [];
    global.WebSocket = MockWebSocket;
    global.fetch = vi.fn(async () => ({ json: async () => ({ token: 'tok' }) }));
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function renderWithUser(opts = {}) {
    const wrapper = ({ children }) => (
      <AuthProvider>
        <SeededAuth>{children}</SeededAuth>
      </AuthProvider>
    );
    const callbacks = {
      onMessage: vi.fn(),
      onStatusUpdate: vi.fn(),
      onPresence: vi.fn(),
      onTyping: vi.fn(),
      onDelete: vi.fn(),
    };
    const { result } = renderHook(
      () => useWebSocket({ ...callbacks, ghost: opts.ghost }),
      { wrapper }
    );
    return { result, callbacks };
  }

  it('connects and authenticates, then exposes send helpers', async () => {
    const { result } = renderWithUser();
    await waitFor(() => expect(result.current.connected).toBe(true));
    const ws = MockWebSocket.instances[0];
    const authMsg = lastSentParsed(ws);
    expect(authMsg.type).toBe('auth');
    expect(authMsg.payload.token).toBe('tok');
  });

  it('sends a message payload', async () => {
    const { result } = renderWithUser();
    await waitFor(() => expect(result.current.connected).toBe(true));
    act(() => result.current.sendMessage({ recipientId: 'r', ciphertext: 'c' }));
    const ws = MockWebSocket.instances[0];
    const msg = lastSentParsed(ws);
    expect(msg.type).toBe('message');
    expect(msg.payload.recipientId).toBe('r');
  });

  it('forwards inbound server messages to callbacks', async () => {
    const { result, callbacks } = renderWithUser();
    await waitFor(() => expect(result.current.connected).toBe(true));
    const ws = MockWebSocket.instances[0];
    act(() => ws.push({ type: 'message', payload: { messageId: 'x', senderId: 'r' } }));
    expect(callbacks.onMessage).toHaveBeenCalledWith({ messageId: 'x', senderId: 'r' });

    act(() => ws.push({ type: 'presence', payload: { userId: 'r', status: 'online' } }));
    expect(callbacks.onPresence).toHaveBeenCalled();
  });

  it('suppresses typing indicators while in ghost mode', async () => {
    const { result } = renderWithUser({ ghost: true });
    await waitFor(() => expect(result.current.connected).toBe(true));
    act(() => result.current.sendTyping('r', true));
    const ws = MockWebSocket.instances[0];
    const typingSent = ws.sent.some(s => JSON.parse(s).type === 'typing');
    expect(typingSent).toBe(false);
  });
});
