import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loadDirectory, searchDirectory } from '../lib/contacts';
import TopBar from '../components/UI/TopBar';
import Identicon from '../components/UI/Identicon';

export default function ContactsList() {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const refresh = useCallback(async () => {
    setLoading(true);
    const dir = await loadDirectory(user?.id);
    setContacts(dir);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = search ? searchDirectory(search) : contacts;

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title="Contacts"
        leftElement={
          <button onClick={() => navigate('/inbox')} className="text-text-meta hover:text-neon-cyan transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        }
      />

      <div className="px-4 py-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="glass-input w-full font-body text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {loading ? (
          <p className="text-text-meta text-sm text-center py-8 font-body">Loading contacts…</p>
        ) : (
          filtered.map(contact => (
            <div
              key={contact.userId}
              onClick={() => navigate(`/chat/${contact.userId}`, { state: { contact } })}
              className="glass cursor-pointer hover:scale-[1.02] transition-transform duration-200 px-4 py-3 flex items-center gap-3"
            >
              <Identicon publicKey={contact.publicKey} size={40} status={contact.status || 'offline'} />
              <div className="flex-1 min-w-0">
                <h3 className="font-space text-sm font-semibold text-text-primary truncate">{contact.username}</h3>
                <p className="font-body text-xs text-text-meta truncate">
                  {contact.demo ? 'Demo contact' : (contact.status === 'online' ? 'Online member' : 'Offline')}
                </p>
              </div>
            </div>
          ))
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-text-meta text-sm text-center py-8 font-body">
            {search ? `No contacts matching "${search}"` : 'No contacts yet'}
          </p>
        )}
      </div>
    </div>
  );
}
