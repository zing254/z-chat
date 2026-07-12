import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveMessage,
  getMessagesForChat,
  updateMessageStatus,
  deleteMessage,
  clearAllMessages,
  hasMessage,
} from '../lib/store/messageStore';

beforeEach(async () => {
  await clearAllMessages();
});

const baseMsg = (over = {}) => ({
  messageId: 'm1',
  direction: 'outgoing',
  senderId: 'a',
  recipientId: 'b',
  chatId: 'b',
  plaintext: 'hi',
  ciphertext: 'x',
  nonce: 'y',
  status: 'sending',
  ttl: 0,
  timestamp: Date.now(),
  ...over,
});

describe('messageStore', () => {
  it('saves and retrieves a message for its chat', async () => {
    await saveMessage(baseMsg());
    const got = await getMessagesForChat('b', 10);
    expect(got.find(m => m.messageId === 'm1')).toBeTruthy();
    expect(hasMessage('m1')).toBe(true);
  });

  it('does not leak messages across different chats', async () => {
    await saveMessage(baseMsg());
    const other = await getMessagesForChat('z', 10);
    expect(other.find(m => m.messageId === 'm1')).toBeFalsy();
  });

  it('updates message status', async () => {
    await saveMessage(baseMsg());
    await updateMessageStatus('m1', 'delivered');
    const got = await getMessagesForChat('b', 10);
    expect(got.find(m => m.messageId === 'm1').status).toBe('delivered');
  });

  it('deletes a message', async () => {
    await saveMessage(baseMsg());
    await deleteMessage('m1');
    const got = await getMessagesForChat('b', 10);
    expect(got.find(m => m.messageId === 'm1')).toBeFalsy();
    expect(hasMessage('m1')).toBe(false);
  });

  it('orders messages chronologically', async () => {
    const older = baseMsg({ messageId: 'old', timestamp: 1000 });
    const newer = baseMsg({ messageId: 'new', timestamp: 2000, chatId: 'b' });
    await saveMessage(older);
    await saveMessage(newer);
    const got = await getMessagesForChat('b', 10);
    expect(got[0].messageId).toBe('old');
    expect(got[got.length - 1].messageId).toBe('new');
  });
});
