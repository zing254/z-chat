import { describe, it, expect } from 'vitest';
import { createDevToken, validateToken } from '../src/websocket/auth.js';
import { env } from '../src/config/env.js';

describe('websocket auth tokens', () => {
  it('creates a token that validates back to the same identity', () => {
    const token = createDevToken('user_42', 'alice');
    const result = validateToken(token);
    expect(result.valid).toBe(true);
    expect(result.userId).toBe('user_42');
    expect(result.username).toBe('alice');
  });

  it('rejects a token signed with a different secret', () => {
    const token = createDevToken('user_42', 'alice');
    const saved = env.JWT_SECRET;
    env.JWT_SECRET = 'a-different-secret';
    const result = validateToken(token);
    env.JWT_SECRET = saved;
    expect(result.valid).toBe(false);
  });

  it('rejects a garbage token', () => {
    expect(validateToken('not-a-real-token').valid).toBe(false);
  });
});
