import { describe, it, expect } from 'vitest';
import { generateKeyPair, encryptMessage, decryptMessage } from '../lib/crypto/naclWrapper';

describe('naclWrapper', () => {
  it('should generate a valid key pair with 32-byte keys', () => {
    const kp = generateKeyPair();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.secretKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.secretKey.length).toBe(32);
  });

  it('should encrypt and decrypt a message roundtrip', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const plaintext = 'Hello, Z-Chat!';

    const encrypted = encryptMessage(plaintext, bob.publicKey, alice.secretKey);
    expect(encrypted).toHaveProperty('ciphertext');
    expect(encrypted).toHaveProperty('nonce');
    expect(encrypted).toHaveProperty('senderPublicKey');

    const decrypted = decryptMessage(
      { ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, senderPublicKey: encrypted.senderPublicKey },
      bob.secretKey,
    );
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same plaintext', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const e1 = encryptMessage('test', bob.publicKey, alice.secretKey);
    const e2 = encryptMessage('test', bob.publicKey, alice.secretKey);
    expect(e1.ciphertext).not.toBe(e2.ciphertext);
  });

  it('should fail decryption with wrong secret key', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const eve = generateKeyPair();
    const encrypted = encryptMessage('secret', bob.publicKey, alice.secretKey);
    expect(() =>
      decryptMessage(
        { ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, senderPublicKey: encrypted.senderPublicKey },
        eve.secretKey,
      )
    ).toThrow();
  });
});