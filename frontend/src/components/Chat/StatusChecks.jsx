export default function StatusChecks({ status }) {
  const config = {
    sending: { checks: '○', color: 'text-text-placeholder', animate: 'animate-spin' },
    sent: { checks: '✓', color: 'text-text-meta' },
    delivered: { checks: '✓✓', color: 'text-text-meta' },
    read: { checks: '✓✓', color: 'text-neon-cyan', glow: true },
    failed: { checks: '!', color: 'text-danger-orange' },
    deleted: { checks: '🔥', color: 'text-danger-orange' },
  };

  const c = config[status] || config.sent;

  return (
    <span className={`font-mono text-xs inline-flex items-center gap-0.5 ${c.color} ${c.glow ? 'drop-shadow-[0_0_4px_rgba(0,240,255,0.6)]' : ''}`}>
      {c.checks}
    </span>
  );
}