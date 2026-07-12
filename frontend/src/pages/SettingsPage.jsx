import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useGhostMode } from '../context/GhostModeContext';
import TopBar from '../components/UI/TopBar';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';
import KeyFingerprint from '../components/Settings/KeyFingerprint';
import { clearAllMessages } from '../lib/store/messageStore';
import { clearKeyPair } from '../lib/store/keyStore';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { ghostMode, toggleGhostMode } = useGhostMode();
  const navigate = useNavigate();

  const handlePurge = async () => {
    if (confirm('Purge all local data? This clears your message history and cache.')) {
      await clearAllMessages();
      alert('Message cache purged. Keys remain.');
    }
  };

  const handleSignOut = async () => {
    await clearKeyPair();
    await clearAllMessages();
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="h-full flex flex-col">
      <TopBar
        title="Settings"
        leftElement={
          <button onClick={() => navigate('/inbox')} className="text-text-meta hover:text-neon-cyan transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <GlassCard>
          <h2 className="font-space text-lg font-semibold text-text-primary">{user?.username}</h2>
          <p className="font-body text-xs text-text-meta mt-1">ID: {user?.id}</p>
        </GlassCard>

        <KeyFingerprint publicKey={user?.publicKey || ''} />

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-space text-sm font-semibold text-text-primary">Theme</h3>
              <p className="font-body text-xs text-text-meta mt-0.5">
                {theme === 'cyber-phantom' ? 'Cyber-Phantom (Cyan)' : 'Midnight Aurora (Green)'}
              </p>
            </div>
            <NeonButton variant="ghost" onClick={toggleTheme} className="text-xs px-3 py-1.5">
              Switch
            </NeonButton>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-space text-sm font-semibold text-neon-violet">Ghost Mode</h3>
              <p className="font-body text-xs text-text-meta mt-0.5">
                {ghostMode ? 'Active — you appear offline, no typing indicators' : 'Off — presence is visible'}
              </p>
            </div>
            <button
              onClick={toggleGhostMode}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${ghostMode ? 'bg-neon-violet' : 'bg-surface-container-high'}`}
              role="switch"
              aria-checked={ghostMode}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 ${ghostMode ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-space text-sm font-semibold text-text-primary">Ephemeral Cache</h3>
              <p className="font-body text-xs text-text-meta mt-0.5">Clear stored message history</p>
            </div>
            <NeonButton variant="danger" onClick={handlePurge} className="text-xs px-3 py-1.5">
              Purge All
            </NeonButton>
          </div>
        </GlassCard>

        <NeonButton variant="danger" onClick={handleSignOut} className="w-full py-3">
          Sign Out & Destroy Session
        </NeonButton>
      </div>
    </div>
  );
}