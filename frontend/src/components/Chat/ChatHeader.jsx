import { useState } from 'react';
import { truncatePublicKey } from '../../utils/identity';
import Identicon from '../UI/Identicon';
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({ username, publicKey, status, onBack }) {
  const navigate = useNavigate();
  const [flipped, setFlipped] = useState(false);

  return (
    <header className="glass sticky top-0 z-30 px-4 py-3 flex items-center gap-3 min-h-[56px]">
      <button
        onClick={() => onBack ? onBack() : navigate('/inbox')}
        className="text-text-meta hover:text-neon-cyan transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <Identicon publicKey={publicKey} size={36} status={status} />

      <div className="flex-1 min-w-0">
        <h2 className="font-space text-sm font-semibold text-text-primary truncate">{username}</h2>
        <p className="font-body text-xs text-text-meta">{status === 'online' ? 'Online' : status === 'typing' ? 'typing...' : 'Offline'}</p>
      </div>

      <button
        onClick={() => setFlipped(!flipped)}
        className="text-text-meta hover:text-neon-violet transition-colors p-1 relative"
        title="Encryption fingerprint"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
        {flipped && (
          <div className="absolute right-0 top-10 glass z-40 px-4 py-3 rounded-lg shadow-[0_0_20px_rgba(176,38,255,0.1)] min-w-[180px]">
            <p className="font-mono text-xs text-neon-violet">{truncatePublicKey(publicKey, 8)}</p>
            <p className="font-body text-[10px] text-text-meta mt-1">E2EE verified</p>
            <button onClick={() => setFlipped(false)} className="absolute top-1 right-2 text-text-meta text-[10px] hover:text-neon-cyan">✕</button>
          </div>
        )}
      </button>
    </header>
  );
}