import { describe, it, expect } from 'vitest';
import { generateKeyPair, encryptMessage, decryptMessage } from '../lib/crypto/naclWrapper';
import pkg from 'tweetnacl-util';
const { encodeBase64 } = pkg;

describe('naclWrapper string-key support', () => {
  it('encrypts with a base64 string recipient public key (ChatWindow flow)', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const bobPubStr = encodeBase64(bob.publicKey);

    const encrypted = encryptMessage('hello string key', bobPubStr, alice.secretKey);
    const decrypted = decryptMessage(
      { ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, senderPublicKey: encrypted.senderPublicKey },
      bob.secretKey,
    );
    expect(decrypted).toBe('hello string key');
  });

  it('encrypts with a Uint8Array recipient key (lib flow)', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const encrypted = encryptMessage('hello u8 key', bob.publicKey, alice.secretKey);
    const decrypted = decryptMessage(
      { ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, senderPublicKey: encrypted.senderPublicKey },
      bob.secretKey,
    );
    expect(decrypted).toBe('hello u8 key');
  });

  it('throws when recipient key is not 32 bytes', () => {
    const alice = generateKeyPair();
    expect(() => encryptMessage('x', 'aGVsbG8=', alice.secretKey)).toThrow();
  });

  it('explodes ciphertext when decrypted with wrong secret key', () => {
    const alice = generateKeyPair();
    const bob = generateKeyPair();
    const eve = generateKeyPair();
    const encrypted = encryptMessage('secret', encodeBase64(bob.publicKey), alice.secretKey);
    expect(() =>
      decryptMessage(
        { ciphertext: encrypted.ciphertext, nonce: encrypted.nonce, senderPublicKey: encrypted.senderPublicKey },
        eve.secretKey,
      )
    ).toThrow();
  });
});
