const BASE = import.meta.env.VITE_API_URL || '';

export async function registerUser({ userId, username, publicKey }) {
  const res = await fetch(`${BASE}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, username, publicKey }),
  });
  if (!res.ok) throw new Error('registration failed');
  return res.json();
}

export async function listUsers(excludeUserId) {
  const url = excludeUserId
    ? `${BASE}/api/users?exclude=${encodeURIComponent(excludeUserId)}`
    : `${BASE}/api/users`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('could not list users');
  return res.json();
}

export async function getUser(userId) {
  const res = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}`);
  if (!res.ok) return null;
  return res.json();
}
