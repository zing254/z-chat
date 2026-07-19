import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGhostMode } from '../context/GhostModeContext';
import { useTyping } from '../context/TypingContext';
import { loadDirectory, getCachedDirectory } from '../lib/contacts';
import { getMessagesForChat } from '../lib/store/messageStore';
import { formatRelativeTime } from '../utils/timers';
import TopBar from '../components/UI/TopBar';
import Identicon from '../components/UI/Identicon';
import NeonButton from '../components/UI/NeonButton';

export default function InboxList() {
  const { user } = useAuth();
  const { ghostMode } = useGhostMode();
  const { typing } = useTyping();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    const contacts = await loadDirectory(user?.id);
    const enriched = await Promise.all(
      contacts.map(async (contact) => {
        const msgs = await getMessagesForChat(contact.userId, 1);
        const last = msgs[msgs.length - 1];
        return {
          ...contact,
          lastMessage: last ? last.plaintext : 'No messages yet',
          time: last ? formatRelativeTime(last.timestamp) : '',
          isEphemeral: !!(last && last.ttl > 0),
          isTyping: !!typing[contact.userId],
        };
      })
    );
    setConversations(enriched);
    setLoading(false);
  }, [user?.id, typing]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title="Z-Chat"
        leftElement={
          <span className="font-space text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-violet">
            Z
          </span>
        }
        rightElement={
          <div className="flex items-center gap-2">
            {ghostMode && (
              <span className="text-[10px] font-mono text-neon-violet px-1.5 py-0.5 rounded border border-neon-violet/40">
                GHOST
              </span>
            )}
            <NeonButton variant="ghost" onClick={() => navigate('/contacts')} className="text-xs px-3 py-1.5">
              + New Chat
            </NeonButton>
            <button onClick={() => navigate('/settings')} className="text-text-meta hover:text-neon-cyan transition-colors font-mono text-xs">
              [settings]
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        {loading ? (
          <p className="text-text-meta text-sm text-center py-8 font-body">Loading conversations…</p>
        ) : (
          conversations.map((contact) => {
            const isTypingNow = !!typing[contact.userId];
            return (
              <div
                key={contact.userId}
                onClick={() => navigate(`/chat/${contact.userId}`, { state: { contact } })}
                className="glass cursor-pointer hover:scale-[1.02] transition-transform duration-200 px-4 py-3 flex items-center gap-3"
              >
                <Identicon
                  publicKey={contact.publicKey}
                  size={44}
                  status={isTypingNow ? 'typing' : contact.status}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-space text-sm font-semibold text-text-primary truncate">
                      {contact.username}
                    </h3>
                    <span className="font-body text-xs text-text-meta shrink-0">
                      {contact.time}
                    </span>
                  </div>

                  <p className={`font-body text-xs truncate mt-0.5 break-words ${
                    contact.isEphemeral
                      ? 'text-danger-orange italic'
                      : 'text-text-meta'
                  }`}>
                    {isTypingNow ? 'typing…' : contact.lastMessage}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-2 border-t border-glass-border">
        <p className="text-text-placeholder text-xs font-mono text-center truncate">
          {ghostMode ? 'Ghost mode · you appear offline' : `Connected as ${user?.username || 'Unknown'}`} · All chats encrypted
        </p>
      </div>
    </div>
  );
}
