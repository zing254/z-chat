import { describe, it, expect } from 'vitest';
import { validateAndCleanPayload } from '../src/websocket/handler.js';

describe('validateAndCleanPayload', () => {
  it('passes through a well-formed message', () => {
    const clean = validateAndCleanPayload({
      recipientId: 'user_b',
      ciphertext: 'YWJj', // 3 bytes base64
      nonce: 'ZGVm',
      senderPublicKey: 'a'.repeat(43),
      ttl: 5,
      messageId: 'm_1',
    });
    expect(clean).not.toBeNull();
    expect(clean.recipientId).toBe('user_b');
    expect(clean.messageId).toBe('m_1');
    expect(clean.ttl).toBe(5);
  });

  it('rejects a message missing recipient or ciphertext', () => {
    expect(validateAndCleanPayload({ recipientId: 'x' })).toBeNull();
    expect(validateAndCleanPayload({ ciphertext: 'YWJj' })).toBeNull();
  });

  it('clamps ttl into the allowed range', () => {
    const tooBig = validateAndCleanPayload({ recipientId: 'b', ciphertext: 'YWJj', nonce: 'ZGVm', ttl: 999999 });
    expect(tooBig.ttl).toBe(86400);
    const negative = validateAndCleanPayload({ recipientId: 'b', ciphertext: 'YWJj', nonce: 'ZGVm', ttl: -5 });
    expect(negative.ttl).toBe(0);
  });

  it('rejects oversized ciphertext', () => {
    const big = 'A'.repeat(6000);
    expect(validateAndCleanPayload({ recipientId: 'b', ciphertext: big })).toBeNull();
  });
});
