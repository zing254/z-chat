import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

function toUint8Array(key) {
  if (typeof key === 'string') {
    try {
      return decodeBase64(key);
    } catch {
      throw new Error('Invalid recipient public key encoding');
    }
  }
  if (key instanceof Uint8Array) return key;
  throw new Error('Recipient public key must be a base64 string or Uint8Array');
}

export function generateKeyPair() {
  return nacl.box.keyPair();
}

export function encryptMessage(plainText, recipientPublicKey, senderSecretKey) {
  const recipientPub = toUint8Array(recipientPublicKey);
  if (recipientPub.length !== nacl.box.publicKeyLength) {
    throw new Error(`Recipient public key must be ${nacl.box.publicKeyLength} bytes`);
  }
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(plainText);
  const encrypted = nacl.box(messageBytes, nonce, recipientPub, senderSecretKey);

  if (!encrypted) {
    throw new Error('Encryption failed');
  }

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
    senderPublicKey: encodeBase64(
      nacl.box.keyPair.fromSecretKey(senderSecretKey).publicKey
    ),
  };
}

export function decryptMessage(payload, recipientSecretKey) {
  const cipherBytes = decodeBase64(payload.ciphertext);
  const nonceBytes = decodeBase64(payload.nonce);
  const senderPubBytes = decodeBase64(payload.senderPublicKey);

  const decrypted = nacl.box.open(cipherBytes, nonceBytes, senderPubBytes, recipientSecretKey);

  if (!decrypted) {
    throw new Error('Decryption failed — wrong key or tampered message');
  }

  return encodeUTF8(decrypted);
}