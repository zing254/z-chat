import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { tmpdir } from 'os';
import { mkdtempSync, rmSync } from 'fs';
import path from 'path';

const dataDir = mkdtempSync(path.join(tmpdir(), 'zchat-test-'));
process.env.ZCHAT_DATA_DIR = dataDir;
process.env.NODE_ENV = 'test';

// Dynamic import AFTER env is set so fileStore picks up ZCHAT_DATA_DIR.
const { server } = await import('../src/server.js');

let base;
beforeAll(async () => {
  await new Promise((res) => server.listen(0, res));
  base = `http://localhost:${server.address().port}`;
});
afterAll(() => {
  server.close();
  rmSync(dataDir, { recursive: true, force: true });
});

async function api(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, body: json };
}

describe('REST API (user registry)', () => {
  it('registers a user and returns their profile', async () => {
    const res = await api('POST', '/api/users/register', {
      userId: 'u_test', username: 'Tester', publicKey: 'H/MFeH4zXbBwCKlA7xRnCKx2KuM8OsMdx3DiHTXU9hM=',
    });
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u_test');
    expect(res.body.username).toBe('Tester');
  });

  it('rejects registration with missing fields', async () => {
    const res = await api('POST', '/api/users/register', { userId: 'x' });
    expect(res.status).toBe(400);
  });

  it('lists users and excludes self', async () => {
    const res = await api('GET', '/api/users?exclude=u_test');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.find((u) => u.userId === 'u_test')).toBeUndefined();
    expect(res.body.length).toBeGreaterThan(0); // seeded demo contacts
  });

  it('fetches a single user by id', async () => {
    const res = await api('GET', '/api/users/u_test');
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('Tester');
  });

  it('returns 404 for unknown user', async () => {
    const res = await api('GET', '/api/users/does_not_exist');
    expect(res.status).toBe(404);
  });

  it('mints a session token', async () => {
    const res = await api('POST', '/api/auth/token', { userId: 'u_test', username: 'Tester' });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });
});
