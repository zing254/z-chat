import { useState, useCallback } from 'react';
import { saveMessage, getMessagesForChat, updateMessageStatus, deleteMessage } from '../lib/store/messageStore';
import { useAuth } from '../context/AuthContext';
import { useEncryption } from './useEncryption';

export function useMessages(chatUserId) {
  const { user } = useAuth();
  const userId = user?.id || 'anon';
  const { encrypt, decrypt } = useEncryption();
  const [messages, setMessages] = useState([]);

  const loadMessages = useCallback(async () => {
    if (!chatUserId) return;
    const msgs = await getMessagesForChat(chatUserId, 200);
    setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
  }, [chatUserId]);

  const addIncoming = useCallback((payload) => {
    try {
      const plaintext = decrypt(payload);
      const msg = {
        messageId: payload.messageId,
        direction: 'incoming',
        senderId: payload.senderId,
        recipientId: userId,
        chatId: payload.senderId,
        plaintext,
        ciphertext: payload.ciphertext,
        nonce: payload.nonce,
        senderPublicKey: payload.senderPublicKey,
        status: 'delivered',
        ttl: payload.ttl || 0,
        timestamp: payload.timestamp || Date.now(),
      };
      setMessages(prev => [...prev, msg].sort((a, b) => a.timestamp - b.timestamp));
      saveMessage(msg);
    } catch (err) {
      console.error('Failed to decrypt incoming message:', err);
    }
  }, [decrypt, userId]);

  const addOutgoing = useCallback(async (plaintext, recipientId, recipientPubKey, ttl = 0) => {
    if (!recipientPubKey) throw new Error('Recipient public key required');

    const encrypted = encrypt(plaintext, recipientPubKey);
    const messageId = `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const msg = {
      messageId,
      direction: 'outgoing',
      senderId: userId,
      recipientId,
      chatId: recipientId,
      plaintext,
      ciphertext: encrypted.ciphertext,
      nonce: encrypted.nonce,
      senderPublicKey: encrypted.senderPublicKey,
      status: 'sending',
      ttl,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, msg]);
    saveMessage(msg);

    return msg;
  }, [encrypt, userId]);

  const updateStatus = useCallback((messageId, newStatus) => {
    setMessages(prev =>
      prev.map(m => m.messageId === messageId ? { ...m, status: newStatus } : m)
    );
    updateMessageStatus(messageId, newStatus);
  }, []);

  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(m => m.messageId !== messageId));
    deleteMessage(messageId);
  }, []);

  const markAsBurned = useCallback((messageId) => {
    setMessages(prev =>
      prev.map(m => m.messageId === messageId
        ? { ...m, status: 'deleted', plaintext: '', isBurned: true, burnTimestamp: Date.now() }
        : m
      )
    );
    deleteMessage(messageId);
  }, []);

  return { messages, loadMessages, addIncoming, addOutgoing, updateStatus, removeMessage, markAsBurned };
}