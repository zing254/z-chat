import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function validateToken(token) {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return { valid: true, userId: decoded.sub || decoded.userId, username: decoded.username };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function createDevToken(userId, username) {
  return jwt.sign({ sub: userId, userId, username }, env.JWT_SECRET, { expiresIn: '24h' });
}