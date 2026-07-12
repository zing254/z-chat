import { openDB } from 'idb';

const DB_NAME = 'ZChatKeys';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('keypair')) {
        db.createObjectStore('keypair');
      }
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions');
      }
    },
  });
}

export async function loadKeyPair() {
  try {
    const db = await getDB();
    let stored = await db.get('keypair', 'main');
    if (!stored) {
      return null;
    }
    return {
      publicKey: new Uint8Array(stored.publicKey),
      secretKey: new Uint8Array(stored.secretKey),
    };
  } catch (err) {
    console.error('Failed to load key pair from IndexedDB:', err);
    return null;
  }
}

export async function saveKeyPair(keyPair) {
  const db = await getDB();
  await db.put('keypair', {
    publicKey: Array.from(keyPair.publicKey),
    secretKey: Array.from(keyPair.secretKey),
  }, 'main');
}

export async function clearKeyPair() {
  const db = await getDB();
  await db.delete('keypair', 'main');
}

export async function loadSessionKey(userId) {
  const db = await getDB();
  return db.get('sessions', userId);
}

export async function saveSessionKey(userId, sessionKey) {
  const db = await getDB();
  await db.put('sessions', sessionKey, userId);
}

export async function isKeyPairStored() {
  const kp = await loadKeyPair();
  return kp !== null;
}