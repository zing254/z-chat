import { describe, it, expect, beforeEach } from 'vitest';
import { loadKeyPair, saveKeyPair, clearKeyPair, isKeyPairStored } from '../lib/store/keyStore';
import { generateKeyPair } from '../lib/crypto/naclWrapper';

describe('keyStore', () => {
  beforeEach(async () => {
    await clearKeyPair();
  });

  it('returns null when no key pair is stored', async () => {
    expect(await loadKeyPair()).toBe(null);
    expect(await isKeyPairStored()).toBe(false);
  });

  it('round-trips a key pair through IndexedDB', async () => {
    const kp = generateKeyPair();
    await saveKeyPair(kp);
    expect(await isKeyPairStored()).toBe(true);

    const loaded = await loadKeyPair();
    expect(loaded.publicKey).toBeInstanceOf(Uint8Array);
    expect(loaded.secretKey).toBeInstanceOf(Uint8Array);
    expect(loaded.publicKey.length).toBe(32);
    expect(loaded.secretKey.length).toBe(32);
  });

  it('clears a stored key pair', async () => {
    await saveKeyPair(generateKeyPair());
    await clearKeyPair();
    expect(await isKeyPairStored()).toBe(false);
  });
});
