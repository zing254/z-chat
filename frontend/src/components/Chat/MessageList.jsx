import { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import MessageBubble from './MessageBubble';

function MessageList({ messages, onMessageTap }, ref) {
  const listRef = useRef(null);

  useImperativeHandle(ref, () => ({
    scrollToItem: () => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    },
  }));

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div ref={listRef} className="h-full overflow-y-auto py-2 space-y-0.5">
      {messages.map(msg => (
        <div key={msg.messageId} className="px-4">
          <MessageBubble message={msg} onTap={() => onMessageTap?.(msg)} />
        </div>
      ))}
    </div>
  );
}

export default forwardRef(MessageList);
