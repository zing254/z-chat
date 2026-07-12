export function createTTLTimer(ttlSeconds, onExpire) {
  const start = Date.now();
  const timer = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed >= ttlSeconds) {
      clearInterval(timer);
      onExpire();
    }
  }, 100);
  return timer;
}

export function formatRelativeTime(timestamp) {
  const diff = (Date.now() - timestamp) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}