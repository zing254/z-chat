import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env.js';
import { setupWebSocket } from './websocket/handler.js';
import { createDevToken } from './websocket/auth.js';
import { getStore } from './store/index.js';

const app = express();
const ALLOWED_ORIGINS = (env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(ALLOWED_ORIGINS.length ? { origin: ALLOWED_ORIGINS } : undefined));
app.use(express.json({ limit: '1mb' }));

const server = http.createServer(app);
setupWebSocket(server);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Mint a short-lived session token used to authenticate the WebSocket relay.
// Identity is anchored to the client-generated keypair, not a password.
app.post('/api/auth/token', (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) {
    return res.status(400).json({ error: 'userId and username required' });
  }
  const token = createDevToken(userId, username);
  res.json({ token, userId });
});

// Register (or re-register) a user's public key in the shared directory.
app.post('/api/users/register', async (req, res) => {
  const { userId, username, publicKey } = req.body;
  if (!userId || !username || !publicKey) {
    return res.status(400).json({ error: 'userId, username and publicKey required' });
  }
  try {
    const user = await getStore().registerUser({ userId, username, publicKey });
    res.json(user);
  } catch (err) {
    console.error('register failed', err);
    res.status(500).json({ error: 'registration failed' });
  }
});

// List users for the contact picker (excludes the caller).
app.get('/api/users', async (req, res) => {
  try {
    const exclude = req.query.exclude;
    const users = await getStore().listUsers(exclude);
    res.json(users);
  } catch (err) {
    console.error('list users failed', err);
    res.status(500).json({ error: 'could not list users' });
  }
});

app.get('/api/users/:userId', async (req, res) => {
  try {
    const user = await getStore().getUser(req.params.userId);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json(user);
  } catch (err) {
    console.error('get user failed', err);
    res.status(500).json({ error: 'could not get user' });
  }
});

process.on('unhandledRejection', (err) => {
  console.error('[fatal] Unhandled promise rejection:', err);
});

if (process.env.NODE_ENV !== 'test') {
  if (env.JWT_SECRET === 'zchat-dev-secret') {
    console.warn('[security] JWT_SECRET is using the insecure dev default. Set JWT_SECRET in production.');
  }
  server.listen(env.PORT, () => {
    getStore(); // initialise + seed demo contacts
    console.log(`Z-Chat relay running on port ${env.PORT}`);
    console.log(`WebSocket ready at ws://localhost:${env.PORT}`);
    console.log(`Health check at http://localhost:${env.PORT}/health`);
  });
}

export { app, server };
