import { openDB } from 'idb';

const DB_NAME = 'ZChatMessages';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('messages')) {
        const store = db.createObjectStore('messages', { keyPath: 'messageId' });
        store.createIndex('chatId', 'chatId');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

const memoryStore = new Map();

export async function saveMessage(message) {
  const msg = { ...message, timestamp: message.timestamp || Date.now() };
  const chatId = msg.direction === 'outgoing' ? msg.recipientId : msg.senderId;
  msg.chatId = chatId;
  memoryStore.set(msg.messageId, msg);

  try {
    const db = await getDB();
    await db.put('messages', msg);
  } catch (err) {
    console.warn('IndexedDB message save failed:', err);
  }
}

export async function getMessagesForChat(userId, limit = 100) {
  const messages = [];
  try {
    const db = await getDB();
    const tx = db.transaction('messages', 'readonly');
    const index = tx.store.index('chatId');
    let cursor = await index.openCursor(userId, 'prev');
    while (cursor && messages.length < limit) {
      messages.push(cursor.value);
      cursor = await cursor.continue();
    }
  } catch (err) {
    console.warn('IndexedDB message load failed, using memory:', err);
  }

  const memMessages = Array.from(memoryStore.values())
    .filter(m => m.chatId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);

  return [...messages, ...memMessages]
    .reduce((acc, msg) => {
      if (!acc.find(m => m.messageId === msg.messageId)) acc.push(msg);
      return acc;
    }, [])
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function updateMessageStatus(messageId, status) {
  const existing = memoryStore.get(messageId);
  if (existing) {
    existing.status = status;
    memoryStore.set(messageId, existing);
  }
  try {
    const db = await getDB();
    const msg = await db.get('messages', messageId);
    if (msg) {
      msg.status = status;
      await db.put('messages', msg);
    }
  } catch (err) {
    console.warn('IndexedDB message status update failed:', err);
  }
}

export async function deleteMessage(messageId) {
  memoryStore.delete(messageId);
  try {
    const db = await getDB();
    await db.delete('messages', messageId);
  } catch (err) {
    console.warn('IndexedDB message delete failed:', err);
  }
}

export async function clearAllMessages() {
  memoryStore.clear();
  try {
    const db = await getDB();
    await db.clear('messages');
  } catch (err) {
    console.warn('IndexedDB clear failed:', err);
  }
}

export function hasMessage(messageId) {
  return memoryStore.has(messageId);
}