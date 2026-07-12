import { truncatePublicKey } from '../../utils/identity';

export default function KeyFingerprint({ publicKey }) {
  return (
    <div className="glass p-4 space-y-2">
      <h3 className="font-space text-sm font-semibold text-neon-violet">Your Encryption Fingerprint</h3>
      <p className="font-mono text-xs text-neon-cyan break-all">{truncatePublicKey(publicKey, 16)}</p>
      <p className="font-mono text-xs text-text-meta">Verify this fingerprint matches your contact's before sharing sensitive information.</p>
    </div>
  );
}
