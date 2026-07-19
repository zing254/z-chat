// Z-Chat relay — Cloudflare Worker + Durable Object.
// Speaks the exact same protocol as the Express/ws backend so the frontend
// (VITE_API_URL / VITE_WS_URL) works unchanged.

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64Url(input) {
  const bytes = typeof input === 'string' ? enc.encode(input) : input;
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function getKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signJWT(payload, secret) {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const sig = await crypto.subtle.sign('HMAC-SHA-256', await getKey(secret), enc.encode(data));
  return `${data}.${toBase64Url(new Uint8Array(sig))}`;
}
async function verifyJWT(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  const ok = await crypto.subtle.verify('HMAC-SHA-256', await getKey(secret), fromBase64Url(parts[2]), enc.encode(data));
  if (!ok) return null;
  try { return JSON.parse(dec.decode(fromBase64Url(parts[1]))); } catch { return null; }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
  });
}
function safeSend(ws, obj) {
  try { ws.send(JSON.stringify(obj)); return true; } catch { return false; }
}

export class Relay {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // userId -> Set<WebSocket>
    this.messageIndex = new Map(); // messageId -> recipientId
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.headers.get('Upgrade') === 'websocket') return this.handleWebSocket(request);
    if (request.method === 'OPTIONS') return corsPreflight();
    if (request.method === 'POST') {
      let body = {};
      try { body = await request.json(); } catch {}
      if (url.pathname === '/api/users/register') return this.register(body);
      if (url.pathname === '/api/auth/token') return this.getToken(body);
    }
    if (request.method === 'GET') {
      if (url.pathname === '/api/users') return this.listUsers(url.searchParams.get('exclude'));
      const m = url.pathname.match(/^\/api\/users\/(.+)$/);
      if (m) return this.getUser(m[1]);
      if (url.pathname === '/health') return json({ status: 'ok' });
    }
    return json({ error: 'Not Found' }, 404);
  }

  async register({ userId, username, publicKey }) {
    if (!userId || !username || !publicKey) return json({ error: 'userId, username and publicKey required' }, 400);
    const users = (await this.state.storage.get('users')) || {};
    users[userId] = { userId, username, publicKey };
    await this.state.storage.put('users', users);
    return json({ userId, username, publicKey });
  }

  async getToken({ userId, username }) {
    if (!userId) return json({ error: 'userId required' }, 400);
    const users = (await this.state.storage.get('users')) || {};
    if (!users[userId]) {
      users[userId] = { userId, username: username || userId, publicKey: null };
      await this.state.storage.put('users', users);
    } else if (username && users[userId].username !== username) {
      users[userId].username = username;
      await this.state.storage.put('users', users);
    }
    const token = await signJWT({ sub: userId, username: users[userId].username }, this.env.JWT_SECRET);
    return json({ token, userId });
  }

  async listUsers(exclude) {
    const users = (await this.state.storage.get('users')) || {};
    const list = Object.values(users)
      .filter((u) => u.userId !== exclude)
      .map((u) => ({ userId: u.userId, username: u.username, publicKey: u.publicKey || '' }));
    return json(list);
  }

  async getUser(userId) {
    const users = (await this.state.storage.get('users')) || {};
    const u = users[userId];
    if (!u) return json({ error: 'user not found' }, 404);
    return json({ userId: u.userId, username: u.username, publicKey: u.publicKey || '' });
  }

  // ---- WebSocket relay ----
  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const meta = { userId: null, publicKey: null, ghost: false };

    server.addEventListener('message', (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      const p = msg.payload || {};

      if (msg.type === 'auth') {
        this.onAuth(server, meta, p);
        return;
      }
      if (!meta.userId) {
        safeSend(server, { type: 'auth_failed', error: 'Not authenticated' });
        return;
      }
      if (msg.type === 'message') this.onMessage(server, meta, p);
      else if (msg.type === 'typing') this.broadcastTo(p.recipientId, 'typing', { senderId: meta.userId, isTyping: !!p.isTyping });
      else if (msg.type === 'status_update') this.broadcastTo(p.recipientId, 'status_update', { messageId: p.messageId, status: p.status });
      else if (msg.type === 'delete') this.onDelete(meta, p);
    });

    const drop = () => { if (meta.userId) this.removeSession(meta.userId, server); };
    server.addEventListener('close', drop);
    server.addEventListener('error', drop);

    return new Response(null, {
      status: 101,
      webSocket: client,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  async onAuth(server, meta, p) {
    const claims = await verifyJWT(p.token, this.env.JWT_SECRET);
    if (!claims || !claims.sub) {
      safeSend(server, { type: 'auth_failed', error: 'Invalid token' });
      server.close();
      return;
    }
    meta.userId = claims.sub;
    meta.publicKey = p.publicKey || null;
    meta.ghost = !!p.ghost;
    this.addSession(meta.userId, server);
    safeSend(server, { type: 'auth_success', payload: { userId: meta.userId } });
    await this.deliverUndelivered(meta.userId, server);
    if (!meta.ghost) this.broadcastToAllExcept(meta.userId, 'presence', { userId: meta.userId, status: 'online' });
  }

  onMessage(server, meta, p) {
    const clean = {
      senderId: meta.userId,
      recipientId: String(p.recipientId || ''),
      ciphertext: String(p.ciphertext || ''),
      nonce: String(p.nonce || ''),
      senderPublicKey: meta.publicKey ? String(meta.publicKey) : String(p.senderPublicKey || ''),
      ttl: Number(p.ttl) || 0,
      messageId: String(p.messageId || `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      timestamp: Date.now(),
      status: 'delivered',
    };
    if (!clean.recipientId) { safeSend(server, { type: 'error', error: 'recipientId required' }); return; }
    this.messageIndex.set(clean.messageId, clean.recipientId);

    const delivered = this.broadcastTo(clean.recipientId, 'message', clean);
    if (delivered) {
      this.broadcastTo(meta.userId, 'status_update', { messageId: clean.messageId, status: 'delivered' });
    } else {
      clean.status = 'sent';
      this.storeUndelivered(clean.recipientId, clean);
      this.broadcastTo(meta.userId, 'status_update', { messageId: clean.messageId, status: 'sent' });
    }
  }

  onDelete(meta, p) {
    const recipientId = this.messageIndex.get(p.messageId) || meta.userId;
    this.broadcastTo(recipientId, 'delete', { messageId: p.messageId });
  }

  // ---- session helpers ----
  addSession(userId, ws) {
    if (!this.sessions.has(userId)) this.sessions.set(userId, new Set());
    this.sessions.get(userId).add(ws);
  }
  removeSession(userId, ws) {
    const set = this.sessions.get(userId);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) {
      this.sessions.delete(userId);
      if (!this.isGhost(userId)) this.broadcastToAllExcept(userId, 'presence', { userId, status: 'offline' });
    }
  }
  isGhost(userId) {
    const set = this.sessions.get(userId);
    return set ? false : false; // presence simple; ghosts omitted at auth time
  }
  broadcastTo(userId, type, payload) {
    const set = this.sessions.get(userId);
    if (!set || set.size === 0) return false;
    let ok = false;
    for (const ws of set) if (safeSend(ws, { type, payload })) ok = true;
    return ok;
  }
  broadcastToAllExcept(userId, type, payload) {
    for (const [uid, set] of this.sessions) {
      if (uid === userId) continue;
      for (const ws of set) safeSend(ws, { type, payload });
    }
  }

  // ---- offline message store ----
  async storeUndelivered(userId, msg) {
    const key = `undelivered:${userId}`;
    const list = (await this.state.storage.get(key)) || [];
    list.push(msg);
    await this.state.storage.put(key, list);
  }
  async deliverUndelivered(userId, ws) {
    const key = `undelivered:${userId}`;
    const list = (await this.state.storage.get(key)) || [];
    if (!list.length) return;
    for (const m of list) safeSend(ws, { type: 'message', payload: m });
    await this.state.storage.delete(key);
  }
}

export default {
  async fetch(request, env) {
    const id = env.RELAY.idFromName('hub');
    const stub = env.RELAY.get(id);
    return stub.fetch(request);
  },
};
