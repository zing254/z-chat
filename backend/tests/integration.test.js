// Integration test for the WebSocket relay: live delivery, offline
// re-delivery, and token/identity binding. Exercises the previously
// untested paths (1.1 missing recipientId, 1.2 getUndelivered key,
// 1.3 auth impersonation, 1.5 multi-session).
process.env.NODE_ENV = 'test';
process.env.ZCHAT_DATA_DIR = `/tmp/zchat-it-${Date.now()}-${Math.random().toString(36).slice(2)}`;

import { beforeAll, afterAll, test, expect } from 'vitest';
import { WebSocket } from 'ws';
import { createDevToken } from '../src/websocket/auth.js';

let server;
let port;

beforeAll(async () => {
  ({ server } = await import('../src/server.js'));
  await new Promise((res) => server.listen(0, res));
  port = server.address().port;
}, 15000);

afterAll(async () => {
  await new Promise((res) => server.close(res));
});

function connectAndAuth(userId, username, opts = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const token = createDevToken(userId, username);
    const received = [];
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      received.push(msg);
      if (msg.type === 'auth_failed') reject(new Error(`auth_failed: ${msg.error}`));
      if (msg.type === 'auth_success') resolve({ ws, received });
    });
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'auth',
        payload: { token, userId, username, publicKey: opts.publicKey || `pk_${userId}`, ghost: !!opts.ghost },
      }));
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('connect timeout')), 8000);
  });
}

function send(ws, obj) {
  ws.send(JSON.stringify(obj));
}

function waitFor(ws, predicate, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('waitFor timeout')), timeout);
    const handler = (raw) => {
      const msg = JSON.parse(raw.toString());
      if (predicate(msg)) {
        clearTimeout(timer);
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);
  });
}

function close(ws) {
  return new Promise((resolve) => {
    ws.on('close', resolve);
    ws.close();
  });
}

test('live message delivery includes recipientId (1.1)', async () => {
  const a = await connectAndAuth('it_a', 'A');
  const b = await connectAndAuth('it_b', 'B');
  const received = waitFor(b.ws, (m) => m.type === 'message');
  send(a.ws, {
    type: 'message',
    payload: { recipientId: 'it_b', ciphertext: 'YWJj', nonce: 'YWJj', senderPublicKey: 'cGte', ttl: 0, messageId: 'm1' },
  });
  const msg = await received;
  expect(msg.payload.recipientId).toBe('it_b');
  expect(msg.payload.messageId).toBe('m1');
  await close(a.ws);
  await close(b.ws);
});

test('offline messages are re-delivered on reconnect (1.2, 1.5)', async () => {
  const a = await connectAndAuth('it_c', 'C');
  const b = await connectAndAuth('it_d', 'D');
  await close(b.ws);
  await new Promise((r) => setTimeout(r, 200));
  send(a.ws, {
    type: 'message',
    payload: { recipientId: 'it_d', ciphertext: 'YWJj', nonce: 'YWJj', senderPublicKey: 'cGte', ttl: 0, messageId: 'm_offline' },
  });
  await new Promise((r) => setTimeout(r, 200));

  const b2 = await connectAndAuth('it_d', 'D');
  // Pending messages are delivered during auth, so check the buffer first
  // (the persistent listener in connectAndAuth already captured it).
  const buffered = b2.received.find(
    (m) => m.type === 'message' && m.payload.messageId === 'm_offline'
  );
  const redelivered = buffered ||
    (await waitFor(b2.ws, (m) => m.type === 'message' && m.payload.messageId === 'm_offline'));
  expect(redelivered.payload.recipientId).toBe('it_d');
  await close(a.ws);
  await close(b2.ws);
});

test('token subject must match claimed identity (1.3)', async () => {
  const ws = new WebSocket(`ws://localhost:${port}`);
  const tokenForA = createDevToken('it_e', 'E');
  const result = new Promise((resolve, reject) => {
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'auth_failed') resolve(msg);
      if (msg.type === 'auth_success') reject(new Error('should not authenticate'));
    });
    ws.on('error', reject);
    setTimeout(() => reject(new Error('timeout')), 4000);
  });
  await new Promise((res) => ws.on('open', res));
  ws.send(JSON.stringify({
    type: 'auth',
    payload: { token: tokenForA, userId: 'it_victim', username: 'victim', publicKey: 'pk' },
  }));
  const failed = await result;
  expect(failed.error).toMatch(/mismatch/i);
  await close(ws);
});
