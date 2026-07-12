import { generateIdenticonSvg } from '../../utils/identity';

export default function Identicon({ publicKey, size = 48, status = 'offline', className = '' }) {
  const statusColors = {
    online: 'shadow-[0_0_0_2px_#00F0FF]',
    typing: 'shadow-[0_0_0_2px_#B026FF] animate-pulse-neon',
    offline: 'shadow-[0_0_0_2px_rgba(255,255,255,0.15)]',
  };

  const src = publicKey ? generateIdenticonSvg(publicKey, size) : '';

  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className={`rounded-full overflow-hidden ${statusColors[status] || statusColors.offline}`}
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt="identicon" width={size} height={size} className="block" />
        ) : (
          <div className="bg-surface-container w-full h-full flex items-center justify-center">
            <span className="text-text-meta font-space text-xs">?</span>
          </div>
        )}
      </div>
    </div>
  );
}