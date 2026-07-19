import { describe, it, expect, vi, beforeEach } from 'vitest';
import pkg from 'tweetnacl-util';
const { decodeBase64 } = pkg;

const USERS = [
  { userId: 'u1', username: 'Ghost Protocol', publicKey: 'H/MFeH4zXbBwCKlA7xRnCKx2KuM8OsMdx3DiHTXU9hM=', status: 'online' },
  { userId: 'u2', username: 'Neon Rider', publicKey: 'He+DXxzcBsX0x9wTS3/mzKGHv6SfZYc5VIAqm+QFNHc=', status: 'offline' },
];

describe('contacts directory', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url.includes('/api/users/nope')) return { ok: false, status: 404, json: async () => ({}) };
      if (/\/api\/users\/[^?]+$/.test(url)) return { ok: true, json: async () => USERS[0] };
      return { ok: true, json: async () => USERS };
    });
  });

  it('loads the directory and caches it', async () => {
    const { loadDirectory, getCachedDirectory } = await import('../lib/contacts');
    const dir = await loadDirectory('me');
    expect(dir.length).toBe(2);
    expect(getCachedDirectory().length).toBe(2);
  });

  it('returns only valid 32-byte public keys', async () => {
    const { loadDirectory } = await import('../lib/contacts');
    const dir = await loadDirectory('me');
    for (const u of dir) expect(decodeBase64(u.publicKey).length).toBe(32);
  });

  it('searches the cached directory case-insensitively', async () => {
    const { loadDirectory, searchDirectory } = await import('../lib/contacts');
    await loadDirectory('me');
    expect(searchDirectory('neon').map(u => u.userId)).toContain('u2');
  });

  it('getContact falls back to unknown for missing ids', async () => {
    const { getContact } = await import('../lib/contacts');
    const missing = await getContact('nope');
    expect(missing.username).toBe('Unknown');
    expect(missing.publicKey).toBe('');
  });
});
