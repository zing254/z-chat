import { WebSocketServer } from 'ws';
import { validateToken } from './auth.js';
import { getStore } from '../store/index.js';

// userId -> Set of connection wrappers (supports multiple tabs/devices per user)
const clients = new Map();
const rateLimitBuckets = new Map();

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 10000;
const MAX_CIPHERTEXT_BYTES = 4096;

function checkRateLimit(userId) {
  const now = Date.now();
  if (!rateLimitBuckets.has(userId)) {
    rateLimitBuckets.set(userId, []);
  }
  const timestamps = rateLimitBuckets.get(userId);
  const cutoff = now - RATE_LIMIT_WINDOW;
  while (timestamps.length > 0 && timestamps[0] < cutoff) {
    timestamps.shift();
  }
  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }
  timestamps.push(now);
  return true;
}

function safeSend(ws, data) {
  try {
    if (ws && ws.readyState === 1) {
      ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  } catch (err) {
    console.warn('[ws] send failed:', err.message);
  }
}

function forEachClient(cb) {
  for (const set of clients.values()) {
    for (const client of set) cb(client);
  }
}

function sendToUser(userId, data) {
  const set = clients.get(userId);
  if (!set) return false;
  let sent = false;
  for (const client of set) {
    if (client.ws.readyState === 1) {
      safeSend(client.ws, data);
      sent = true;
    }
  }
  return sent;
}

async function safeStore(fn) {
  try {
    return await fn();
  } catch (err) {
    console.error('[store] error:', err.message);
  }
}

export function validateAndCleanPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const cleaned = {};

  if (typeof payload.recipientId === 'string' && payload.recipientId.length <= 64) {
    cleaned.recipientId = payload.recipientId;
  }

  if (typeof payload.ciphertext === 'string') {
    const bytes = Buffer.byteLength(payload.ciphertext, 'base64');
    if (bytes > 0 && bytes <= MAX_CIPHERTEXT_BYTES) {
      cleaned.ciphertext = payload.ciphertext;
    }
  }

  if (typeof payload.nonce === 'string' && payload.nonce.length <= 64) {
    cleaned.nonce = payload.nonce;
  }

  if (typeof payload.senderPublicKey === 'string' && payload.senderPublicKey.length <= 128) {
    cleaned.senderPublicKey = payload.senderPublicKey;
  }

  cleaned.ttl = Math.min(Math.max(0, Number(payload.ttl) || 0), 86400);

  if (typeof payload.messageId === 'string' && payload.messageId.length <= 64) {
    cleaned.messageId = payload.messageId;
  }

  if (!cleaned.recipientId || !cleaned.ciphertext || !cleaned.nonce) return null;

  return cleaned;
}

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, maxPayload: 1 << 20 });

  wss.on('connection', (ws) => {
    let userId = null;
    let authenticated = false;
    let me = null;

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        safeSend(ws, { type: 'error', error: 'Invalid JSON' });
        return;
      }

      if (msg.type === 'auth') {
        const { token, userId: authUserId, username, publicKey, ghost } = msg.payload || {};
        if (!token || !authUserId || typeof authUserId !== 'string') {
          safeSend(ws, { type: 'auth_failed', error: 'Invalid auth payload' });
          ws.close(1008, 'Unauthorized');
          return;
        }
        const result = validateToken(token);
        if (!result.valid) {
          safeSend(ws, { type: 'auth_failed', error: result.error });
          ws.close(1008, 'Unauthorized');
          return;
        }
        // Bind the token's subject to the claimed identity to prevent impersonation.
        if (result.userId && result.userId !== authUserId) {
          safeSend(ws, { type: 'auth_failed', error: 'Token/identity mismatch' });
          ws.close(1008, 'Unauthorized');
          return;
        }
        userId = authUserId;
        authenticated = true;
        ws.userId = userId;
        ws.ghost = !!ghost;
        me = {
          ws,
          userId,
          username: String(username || '').slice(0, 32),
          publicKey: String(publicKey || ''),
          ghost: !!ghost,
        };
        if (!clients.has(userId)) clients.set(userId, new Set());
        clients.get(userId).add(me);

        try {
          const pending = await getStore().getUndelivered(userId);
          for (const p of pending) {
            safeSend(ws, { type: 'message', payload: p });
            await getStore().markDelivered(p.messageId);
          }
        } catch (err) {
          console.error('[ws] failed to deliver pending messages:', err.message);
        }

        if (!me.ghost) broadcastStatus(userId, 'online');

        safeSend(ws, { type: 'auth_success', userId });
        return;
      }

      if (!authenticated) {
        safeSend(ws, { type: 'error', error: 'Authenticate first' });
        return;
      }

      if (!checkRateLimit(userId)) {
        safeSend(ws, { type: 'error', error: 'Rate limit exceeded' });
        return;
      }

      if (msg.type === 'message') {
        const cleaned = validateAndCleanPayload(msg.payload);
        if (!cleaned) {
          safeSend(ws, { type: 'error', error: 'Invalid message payload' });
          return;
        }

        const relayMsg = {
          ciphertext: cleaned.ciphertext,
          nonce: cleaned.nonce,
          // Override any self-asserted key with the authenticated connection's key.
          senderPublicKey: me?.publicKey || cleaned.senderPublicKey || '',
          recipientId: cleaned.recipientId,
          senderId: userId,
          ttl: cleaned.ttl,
          messageId: cleaned.messageId || `${userId}_${Date.now()}`,
          timestamp: Date.now(),
        };

        const delivered = sendToUser(cleaned.recipientId, JSON.stringify({ type: 'message', payload: relayMsg }));
        if (delivered) {
          await safeStore(() => getStore().saveMessage({ ...relayMsg, status: 'delivered' }));
          safeSend(ws, {
            type: 'status_update',
            payload: { messageId: relayMsg.messageId, status: 'delivered' },
          });
        } else {
          await safeStore(() => getStore().saveMessage({ ...relayMsg, status: 'sent' }));
          safeSend(ws, {
            type: 'status_update',
            payload: { messageId: relayMsg.messageId, status: 'sent' },
          });
        }
        return;
      }

      if (msg.type === 'status_update') {
        const { recipientId, messageId, status } = msg.payload || {};
        if (!recipientId || !messageId) return;
        sendToUser(recipientId, JSON.stringify({
          type: 'status_update',
          payload: { messageId, status },
        }));
        return;
      }

      if (msg.type === 'delete') {
        const { messageId } = msg.payload || {};
        if (!messageId) return;
        await safeStore(() => getStore().deleteMessage(messageId));
        broadcastExcept(userId, JSON.stringify({ type: 'delete', payload: { messageId } }));
        return;
      }

      if (msg.type === 'typing') {
        const { recipientId, isTyping } = msg.payload || {};
        if (!recipientId) return;
        sendToUser(recipientId, JSON.stringify({
          type: 'typing',
          payload: { senderId: userId, isTyping: !!isTyping },
        }));
        return;
      }
    });

    ws.on('close', () => {
      if (userId) {
        rateLimitBuckets.delete(userId);
        const set = clients.get(userId);
        if (set) {
          set.delete(me);
          if (set.size === 0) clients.delete(userId);
        }
        if (!ws.ghost) broadcastStatus(userId, 'offline');
      }
    });

    ws.on('error', () => {});
  });
}

function broadcastStatus(userId, status) {
  const data = JSON.stringify({ type: 'presence', payload: { userId, status } });
  forEachClient((client) => {
    if (client.userId !== userId) safeSend(client.ws, data);
  });
}

function broadcastExcept(excludeUserId, data) {
  forEachClient((client) => {
    if (client.userId !== excludeUserId) safeSend(client.ws, data);
  });
}
