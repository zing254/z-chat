import { motion } from 'framer-motion';
import StatusChecks from './StatusChecks';
import EphemeralRing from './EphemeralRing';

export default function MessageBubble({ message, onTap, showStatus = true }) {
  const isOutgoing = message.direction === 'outgoing';
  const isBurned = message.isBurned;

  if (isBurned) {
    return (
      <div className="flex items-center justify-center py-1">
        <span className="font-mono text-[10px] italic text-danger-orange opacity-60">
          Message burned at {new Date(message.burnTimestamp).toLocaleTimeString()}
        </span>
      </div>
    );
  }

  const bubbleClass = isOutgoing
    ? 'message-bubble-outgoing ml-auto'
    : 'message-bubble-incoming mr-auto';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onTap?.(message)}
      className={`${bubbleClass} max-w-[75%] px-4 py-2.5 mb-1 cursor-pointer select-none relative`}
    >
      <p className="font-body text-sm leading-relaxed text-text-primary break-words whitespace-pre-wrap">
        {message.plaintext || '[encrypted]'}
      </p>

      <div className="flex items-center justify-end gap-1.5 mt-1">
        {message.ttl > 0 && !isBurned && (
          <EphemeralRing ttl={message.ttl} createdAt={message.timestamp} />
        )}
        {showStatus && isOutgoing && (
          <StatusChecks status={message.status} />
        )}
        <span className="text-text-placeholder font-body text-[10px]">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}