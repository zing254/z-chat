import { listUsers, getUser } from './api';

let cache = [];

export async function loadDirectory(excludeUserId) {
  try {
    cache = await listUsers(excludeUserId);
  } catch (err) {
    console.warn('Could not load directory, using cache:', err.message);
  }
  return cache;
}

export function getCachedDirectory() {
  return cache || [];
}

export async function getContact(id) {
  const cached = cache.find(c => c.userId === id);
  if (cached) return cached;
  const fresh = await getUser(id);
  return fresh || { userId: id, username: 'Unknown', publicKey: '', status: 'offline' };
}

export function searchDirectory(query) {
  const q = String(query || '').toLowerCase();
  return getCachedDirectory().filter(c => c.username.toLowerCase().includes(q));
}
