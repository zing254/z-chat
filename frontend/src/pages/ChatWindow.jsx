import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGhostMode } from '../context/GhostModeContext';
import { useTyping } from '../context/TypingContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMessages } from '../hooks/useMessages';
import { getContact } from '../lib/contacts';
import { createTTLTimer } from '../utils/timers';
import ChatHeader from '../components/Chat/ChatHeader';
import MessageList from '../components/Chat/MessageList';
import Composer from '../components/Chat/Composer';
import TypingIndicator from '../components/Chat/TypingIndicator';
import DissolveEffect from '../components/Chat/DissolveEffect';
import { playSendSound, playReceiveSound, playDissolveSound } from '../lib/audio/effects';

export default function ChatWindow() {
  const { userId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { ghostMode } = useGhostMode();
  const { setTypingFor } = useTyping();
  const { messages, loadMessages, addIncoming, addOutgoing, updateStatus, markAsBurned } = useMessages(userId);

  const [contact, setContact] = useState(
    () => location.state?.contact || { userId, username: '…', publicKey: '', status: 'offline' }
  );
  const [isTyping, setIsTyping] = useState(false);
  const [dissolving, setDissolving] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const listRef = useRef(null);
  const burnTimers = useRef(new Map());
  const burnedRef = useRef(new Set());
  const readReceipts = useRef(new Set());

  useEffect(() => {
    getContact(userId).then(setContact);
  }, [userId]);

  const handleMessage = useCallback((payload) => {
    addIncoming(payload);
    playReceiveSound();
    if (payload.ttl > 0) {
      const timer = createTTLTimer(payload.ttl, () => {
        const id = payload.messageId;
        if (burnedRef.current.has(id)) return;
        burnedRef.current.add(id);
        markAsBurned(id);
        sendDeleteRef.current(id);
        burnTimers.current.delete(id);
      });
      burnTimers.current.set(payload.messageId, timer);
    }
  }, [addIncoming, markAsBurned]);

  const handleStatusUpdate = useCallback((payload) => {
    updateStatus(payload.messageId, payload.status);
  }, [updateStatus]);

  const handleTyping = useCallback((payload) => {
    setIsTyping(payload.isTyping);
    setTypingFor(payload.senderId, payload.isTyping);
  }, [setTypingFor]);

  const handlePresence = useCallback((payload) => {
    if (payload.userId === userId) {
      setContact(prev => ({ ...prev, status: payload.status }));
    }
  }, [userId]);

  const { connected, sendMessage, sendDelete, sendStatus, sendTyping } = useWebSocket({
    onMessage: handleMessage,
    onStatusUpdate: handleStatusUpdate,
    onTyping: handleTyping,
    onPresence: handlePresence,
    onDelete: (p) => markAsBurned(p.messageId),
    ghost: ghostMode,
  });

  const sendDeleteRef = useRef(sendDelete);
  sendDeleteRef.current = sendDelete;

  useEffect(() => {
    if (connected) setConnecting(false);
  }, [connected]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const timers = burnTimers.current;
    return () => {
      timers.forEach(t => clearInterval(t));
      timers.clear();
    };
  }, []);

  // Send read receipts for incoming messages once we're connected.
  useEffect(() => {
    if (!connected) return;
    messages.forEach(m => {
      if (m.direction === 'incoming' && m.status !== 'read' && !readReceipts.current.has(m.messageId)) {
        readReceipts.current.add(m.messageId);
        sendStatus(m.senderId, m.messageId, 'read');
      }
    });
  }, [messages, connected, sendStatus]);

  const handleSend = useCallback(async (text, ephemeral) => {
    const ttl = ephemeral ? 3 : 0;
    if (!contact.publicKey) {
      console.error('No public key for recipient; cannot encrypt');
      return;
    }
    try {
      const msgData = await addOutgoing(text, userId, contact.publicKey, ttl);
      playSendSound();
      sendMessage({
        recipientId: userId,
        ciphertext: msgData.ciphertext,
        nonce: msgData.nonce,
        senderPublicKey: msgData.senderPublicKey,
        ttl,
        messageId: msgData.messageId,
      });
    } catch (err) {
      console.error('Send failed:', err);
    }
  }, [addOutgoing, userId, contact.publicKey, sendMessage]);

  const handleMessageTap = useCallback((message) => {
    if (message.ttl > 0 && message.direction === 'incoming' && !message.isBurned) {
      // Cancel the auto-burn timer so we don't burn twice.
      const timer = burnTimers.current.get(message.messageId);
      if (timer) {
        clearInterval(timer);
        burnTimers.current.delete(message.messageId);
      }
      setDissolving({ messageId: message.messageId, text: message.plaintext || '...' });
    }
  }, []);

  const handleDissolveComplete = useCallback(() => {
    if (!dissolving) return;
    const id = dissolving.messageId;
    if (burnedRef.current.has(id)) {
      setDissolving(null);
      return;
    }
    burnedRef.current.add(id);
    markAsBurned(id);
    sendDelete(id);
    playDissolveSound();
    setDissolving(null);
  }, [dissolving, markAsBurned, sendDelete]);

  return (
    <div className="h-full flex flex-col relative">
      <ChatHeader
        username={contact.username}
        publicKey={contact.publicKey}
        status={contact.status}
      />

      <div className="flex-1 overflow-hidden relative">
        <MessageList
          messages={messages}
          onMessageTap={handleMessageTap}
          ref={listRef}
        />

        {isTyping && (
          <div className="absolute bottom-0 left-0 w-full px-4 pb-2">
            <TypingIndicator />
          </div>
        )}

        {dissolving && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-void bg-opacity-80 z-50">
            <DissolveEffect
              text={dissolving.text}
              onComplete={handleDissolveComplete}
              duration={3000}
            />
          </div>
        )}
      </div>

      {!connected && (
        <div className="animate-slide-down bg-danger-orange bg-opacity-20 text-danger-orange text-xs font-mono px-4 py-1 text-center">
          {connecting ? 'Connecting...' : 'Reconnecting...'}
        </div>
      )}

      <Composer
        onSend={handleSend}
        onTyping={(v) => sendTyping(userId, v)}
        disabled={!connected}
      />
    </div>
  );
}
