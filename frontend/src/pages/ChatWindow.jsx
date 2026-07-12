import { useEffect, useRef, useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGhostMode } from '../context/GhostModeContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useMessages } from '../hooks/useMessages';
import { getContact } from '../lib/contacts';
import { createTTLTimer } from '../utils/timers';
import ChatHeader from '../components/Chat/ChatHeader';
import MessageList from '../components/Chat/MessageList';
import Composer from '../components/Chat/Composer';
import TypingIndicator from '../components/Chat/TypingIndicator';
import DissolveEffect from '../components/Chat/DissolveEffect';

export default function ChatWindow() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { ghostMode } = useGhostMode();
  const { messages, loadMessages, addIncoming, addOutgoing, updateStatus, markAsBurned } = useMessages(userId);

  const [contact, setContact] = useState(() => getContact(userId));
  const [isTyping, setIsTyping] = useState(false);
  const [dissolving, setDissolving] = useState(null);
  const [connecting, setConnecting] = useState(true);

  const listRef = useRef(null);
  const burnTimers = useRef(new Map());

  useEffect(() => {
    setContact(getContact(userId));
  }, [userId]);

  const handleMessage = useCallback((payload) => {
    addIncoming(payload);
    if (payload.ttl > 0) {
      const timer = createTTLTimer(payload.ttl, () => {
        markAsBurned(payload.messageId);
        sendDeleteRef.current(payload.messageId);
        burnTimers.current.delete(payload.messageId);
      });
      burnTimers.current.set(payload.messageId, timer);
    }
  }, [addIncoming, markAsBurned]);

  const handleStatusUpdate = useCallback((payload) => {
    updateStatus(payload.messageId, payload.status);
  }, [updateStatus]);

  const handleTyping = useCallback((payload) => {
    setIsTyping(payload.isTyping);
  }, []);

  const handlePresence = useCallback((payload) => {
    if (payload.userId === userId) {
      setContact(prev => ({ ...prev, status: payload.status }));
    }
  }, [userId]);

  const { connected, sendMessage, sendDelete } = useWebSocket({
    onMessage: handleMessage,
    onStatusUpdate: handleStatusUpdate,
    onTyping: handleTyping,
    onPresence: handlePresence,
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

  const handleSend = useCallback(async (text, ephemeral) => {
    const ttl = ephemeral ? 3 : 0;
    try {
      const msgData = await addOutgoing(text, userId, contact.publicKey, ttl);
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
      setDissolving({ messageId: message.messageId, text: message.plaintext || '...' });
    }
  }, []);

  const handleDissolveComplete = useCallback(() => {
    if (!dissolving) return;
    markAsBurned(dissolving.messageId);
    sendDelete(dissolving.messageId);
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

      <Composer onSend={handleSend} disabled={!connected} />
    </div>
  );
}
