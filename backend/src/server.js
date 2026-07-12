import express from 'express';
import cors from 'cors';
import http from 'http';
import { env } from './config/env.js';
import { setupWebSocket } from './websocket/handler.js';
import { createDevToken } from './websocket/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

setupWebSocket(server);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.post('/api/auth/token', (req, res) => {
  const { userId, username } = req.body;
  if (!userId || !username) {
    return res.status(400).json({ error: 'userId and username required' });
  }
  const token = createDevToken(userId, username);
  res.json({ token, userId });
});

server.listen(env.PORT, () => {
  console.log(`Z-Chat relay running on port ${env.PORT}`);
  console.log(`WebSocket ready at ws://localhost:${env.PORT}`);
  console.log(`Health check at http://localhost:${env.PORT}/health`);
});