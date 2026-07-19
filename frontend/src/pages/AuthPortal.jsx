import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEncryption } from '../hooks/useEncryption';
import { encodeBase64 } from 'tweetnacl-util';
import { generateUserId } from '../utils/identity';
import { registerUser } from '../lib/api';
import ParticleMatrix from '../components/Auth/ParticleMatrix';
import GlassCard from '../components/UI/GlassCard';
import NeonButton from '../components/UI/NeonButton';

export default function AuthPortal() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { generateNewKeyPair, getPublicKeyString } = useEncryption();
  const navigate = useNavigate();

  const handleSignIn = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError('Enter a username to begin');
      return;
    }
    if (trimmed.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const kp = await generateNewKeyPair();
      await new Promise(r => setTimeout(r, 300));

      const userId = generateUserId();
      const publicKeyStr = encodeBase64(kp.publicKey);

      // Publish our public key to the shared directory so others can message us.
      // If the relay is unreachable we still proceed in local-only mode.
      try {
        await registerUser({ userId, username: trimmed, publicKey: publicKeyStr });
      } catch (regErr) {
        console.warn('Backend registration skipped (local-only mode):', regErr.message);
      }

      signIn(
        { id: userId, username: trimmed, publicKey: publicKeyStr },
        kp
      );

      navigate('/inbox', { replace: true });
    } catch (err) {
      setError('Failed to generate encryption keys. Try again.');
      setLoading(false);
    }
  }, [username, generateNewKeyPair, getPublicKeyString, signIn, navigate]);

  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <ParticleMatrix />

      <GlassCard variant="floating" className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="font-space text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-violet">
            Z-CHAT
          </h1>
          <p className="text-text-meta text-sm mt-2 font-body">
            Private. Ephemeral. Phantom-grade encryption.
          </p>
        </div>

        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-text-meta text-xs font-medium mb-2 font-body uppercase tracking-wider">
              Identity
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your alias..."
              autoFocus
              disabled={loading}
              className="glass-input w-full font-body"
            />
          </div>

          {error && (
            <p className="text-danger-orange text-xs font-body">{error}</p>
          )}

          <NeonButton
            type="submit"
            variant="skeleton"
            loading={loading}
            disabled={!username.trim() || loading}
            className="w-full py-4 text-base"
          >
            {loading ? 'Generating your private shield...' : 'Enter the Void'}
          </NeonButton>
        </form>

        <p className="text-text-placeholder text-xs text-center mt-6 font-body">
          Your encryption keys are generated locally. Nothing leaves this device.
        </p>
      </GlassCard>
    </div>
  );
}