import { WebSocketServer } from 'ws';
import { validateToken } from './auth.js';

const clients = new Map();
const offlineMessages = new Map();
const rateLimitBuckets = new Map();

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 10000;
const OFFLINE_MAX_PER_USER = 100;
const OFFLINE_TTL = 24 * 60 * 60 * 1000;
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

function validateAndCleanPayload(payload) {
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

function storeOfflineMessage(userId, msg) {
  const now = Date.now();
  let queue = offlineMessages.get(userId);

  if (!queue || queue.length === 0) {
    queue = [];
    offlineMessages.set(userId, queue);
  }

  while (queue.length > 0 && (now - queue[0].timestamp) > OFFLINE_TTL) {
    queue.shift();
  }

  if (queue.length >= OFFLINE_MAX_PER_USER) {
    queue.shift();
  }

  queue.push(msg);
}

function evictStaleOffline() {
  const now = Date.now();
  const cutoff = now - OFFLINE_TTL;
  for (const [userId, queue] of offlineMessages) {
    while (queue.length > 0 && queue[0].timestamp < cutoff) {
      queue.shift();
    }
    if (queue.length === 0) {
      offlineMessages.delete(userId);
    }
  }
}

setInterval(evictStaleOffline, 60_000);

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let userId = null;
    let authenticated = false;

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', error: 'Invalid JSON' }));
        return;
      }

      if (msg.type === 'auth') {
        const { token, userId: authUserId, username, publicKey, ghost } = msg.payload || {};
        if (!token || !authUserId || typeof authUserId !== 'string') {
          ws.send(JSON.stringify({ type: 'auth_failed', error: 'Invalid auth payload' }));
          ws.close(1008, 'Unauthorized');
          return;
        }
        const result = validateToken(token);
        if (!result.valid) {
          ws.send(JSON.stringify({ type: 'auth_failed', error: result.error }));
          ws.close(1008, 'Unauthorized');
          return;
        }
        userId = authUserId;
        authenticated = true;
        ws.userId = userId;
        ws.ghost = !!ghost;
        clients.set(userId, {
          ws,
          username: String(username || '').slice(0, 32),
          publicKey: String(publicKey || ''),
          ghost: !!ghost,
        });

        const pending = offlineMessages.get(userId) || [];
        pending.forEach(p => {
          ws.send(JSON.stringify({ type: 'message', payload: p }));
        });
        offlineMessages.delete(userId);

        if (!ws.ghost) broadcastStatus(userId, 'online');

        ws.send(JSON.stringify({ type: 'auth_success', userId }));
        return;
      }

      if (!authenticated) {
        ws.send(JSON.stringify({ type: 'error', error: 'Authenticate first' }));
        return;
      }

      if (!checkRateLimit(userId)) {
        ws.send(JSON.stringify({ type: 'error', error: 'Rate limit exceeded' }));
        return;
      }

      if (msg.type === 'message') {
        const cleaned = validateAndCleanPayload(msg.payload);
        if (!cleaned) {
          ws.send(JSON.stringify({ type: 'error', error: 'Invalid message payload' }));
          return;
        }

        const client = clients.get(userId);

        const relayMsg = {
          ciphertext: cleaned.ciphertext,
          nonce: cleaned.nonce,
          senderPublicKey: cleaned.senderPublicKey || client?.publicKey || '',
          senderId: userId,
          ttl: cleaned.ttl,
          messageId: cleaned.messageId || `${userId}_${Date.now()}`,
          timestamp: Date.now(),
        };

        const recipient = clients.get(cleaned.recipientId);
        if (recipient && recipient.ws.readyState === 1) {
          recipient.ws.send(JSON.stringify({ type: 'message', payload: relayMsg }));
          ws.send(JSON.stringify({
            type: 'status_update',
            payload: { messageId: relayMsg.messageId, status: 'delivered' },
          }));
        } else {
          storeOfflineMessage(cleaned.recipientId, relayMsg);
          ws.send(JSON.stringify({
            type: 'status_update',
            payload: { messageId: relayMsg.messageId, status: 'sent' },
          }));
        }
        return;
      }

      if (msg.type === 'status_update') {
        const { recipientId, messageId, status } = msg.payload || {};
        if (!recipientId || !messageId) return;
        const recipient = clients.get(recipientId);
        if (recipient && recipient.ws.readyState === 1) {
          recipient.ws.send(JSON.stringify({
            type: 'status_update',
            payload: { messageId, status },
          }));
        }
        return;
      }

      if (msg.type === 'delete') {
        const { messageId } = msg.payload || {};
        if (!messageId) return;
        broadcastExcept(userId, JSON.stringify({ type: 'delete', payload: { messageId } }));
        return;
      }

      if (msg.type === 'typing') {
        const { recipientId, isTyping } = msg.payload || {};
        if (!recipientId) return;
        const recipient = clients.get(recipientId);
        if (recipient && recipient.ws.readyState === 1) {
          recipient.ws.send(JSON.stringify({
            type: 'typing',
            payload: { senderId: userId, isTyping: !!isTyping },
          }));
        }
        return;
      }
    });

    ws.on('close', () => {
      if (userId) {
        rateLimitBuckets.delete(userId);
        if (!ws.ghost) broadcastStatus(userId, 'offline');
        clients.delete(userId);
      }
    });

    ws.on('error', () => {});
  });
}

function broadcastStatus(userId, status) {
  const msg = JSON.stringify({ type: 'presence', payload: { userId, status } });
  clients.forEach((client, id) => {
    if (id !== userId && client.ws.readyState === 1) {
      client.ws.send(msg);
    }
  });
}

function broadcastExcept(excludeUserId, data) {
  clients.forEach((client, id) => {
    if (id !== excludeUserId && client.ws.readyState === 1) {
      client.ws.send(data);
    }
  });
}
