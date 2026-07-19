import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.ZCHAT_DATA_DIR
  ? path.resolve(process.env.ZCHAT_DATA_DIR)
  : path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MSG_FILE = path.join(DATA_DIR, 'messages.json');

async function readJson(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(file, JSON.stringify(data, null, 2));
}

// A few demo contacts so a fresh deployment has something to look at.
// Their public keys are real 32-byte base64 values (encryption works; nobody
// holds the secret, so they act as placeholders / echo targets).
const DEMO_CONTACTS = [
  { userId: 'demo_ghost', username: 'Ghost Protocol', publicKey: 'H/MFeH4zXbBwCKlA7xRnCKx2KuM8OsMdx3DiHTXU9hM=' },
  { userId: 'demo_neon', username: 'Neon Rider', publicKey: 'He+DXxzcBsX0x9wTS3/mzKGHv6SfZYc5VIAqm+QFNHc=' },
  { userId: 'demo_cipher', username: 'Cipher_Mist', publicKey: 'x2lQeSv7T4Rz2xokMBir7m5M99wg5Rb0c+8au0IJc3A=' },
  { userId: 'demo_shadow', username: 'Shadow_Net', publicKey: 'OzuaiciQDtGu77hiKO3owhDhGtBiWhaMJVWPwfya4mM=' },
  { userId: 'demo_void', username: 'VoidWalker', publicKey: 'kyU1HDN53WlYhjHG8XXygjDVE6V4o85KUiIxIhKqcg4=' },
];

export function createFileStore() {
  let users = null;
  let messages = null;

  async function ensure() {
    if (users === null) users = await readJson(USERS_FILE, null);
    if (users === null) {
      users = {};
      for (const c of DEMO_CONTACTS) {
        users[c.userId] = { ...c, demo: true, createdAt: Date.now() };
      }
      await writeJson(USERS_FILE, users);
    }
    if (messages === null) messages = await readJson(MSG_FILE, []);
  }

  const normalizeMsg = (m) => ({
    messageId: m.message_id || m.messageId,
    senderId: m.sender_id || m.senderId,
    recipientId: m.recipient_id || m.recipientId,
    ciphertext: m.ciphertext,
    nonce: m.nonce,
    senderPublicKey: m.sender_public_key || m.senderPublicKey,
    ttl: m.ttl || 0,
    status: m.status || 'sent',
    timestamp: m.created_at || m.timestamp || Date.now(),
  });

  return {
    kind: 'file',
    async registerUser({ userId, username, publicKey }) {
      await ensure();
      users[userId] = { userId, username, publicKey, createdAt: Date.now() };
      await writeJson(USERS_FILE, users);
      return users[userId];
    },
    async getUser(userId) {
      await ensure();
      return users[userId] || null;
    },
    async getUserByUsername(username) {
      await ensure();
      return Object.values(users).find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
    },
    async listUsers(excludeUserId) {
      await ensure();
      return Object.values(users).filter(u => u.userId !== excludeUserId);
    },
    async saveMessage(msg) {
      await ensure();
      messages.push(normalizeMsg(msg));
      await writeJson(MSG_FILE, messages);
    },
    async getUndelivered(recipientId) {
      await ensure();
      return messages
        .filter(m => m.recipientId === recipientId && m.status !== 'delivered' && m.status !== 'deleted')
        .map(normalizeMsg);
    },
    async markDelivered(messageId) {
      await ensure();
      const m = messages.find(x => (x.message_id || x.messageId) === messageId);
      if (m) m.status = 'delivered';
      await writeJson(MSG_FILE, messages);
    },
    async deleteMessage(messageId) {
      await ensure();
      const m = messages.find(x => (x.message_id || x.messageId) === messageId);
      if (m) m.status = 'deleted';
      await writeJson(MSG_FILE, messages);
    },
  };
}
