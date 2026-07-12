import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

export function generateRatchetKeyPair() {
  return nacl.box.keyPair();
}

export function advanceRatchet(sessionKeyPair) {
  const newPair = nacl.box.keyPair();
  const dhSeed = nacl.box.before(
    newPair.publicKey,
    sessionKeyPair.secretKey
  );
  const nextKey = nacl.hash(dhSeed).slice(0, 32);
  return { keyPair: newPair, nextRootKey: nextKey };
}

export function serializeKeyPair(keyPair) {
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

export function deserializeKeyPair(serialized) {
  return {
    publicKey: decodeBase64(serialized.publicKey),
    secretKey: decodeBase64(serialized.secretKey),
  };
}

export function createSessionKey(senderKeyPair, receiverPublicKey) {
  return nacl.box.before(receiverPublicKey, senderKeyPair.secretKey);
}