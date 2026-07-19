import { useState, useRef, useCallback } from 'react';

export default function Composer({ onSend, onTyping, disabled = false }) {
  const [text, setText] = useState('');
  const [ephemeral, setEphemeral] = useState(false);
  const editorRef = useRef(null);
  const typingRef = useRef(false);

  const notifyTyping = useCallback((isTyping) => {
    if (disabled) return;
    if (isTyping && !typingRef.current) {
      typingRef.current = true;
      onTyping?.(true);
    } else if (!isTyping && typingRef.current) {
      typingRef.current = false;
      onTyping?.(false);
    }
  }, [disabled, onTyping]);

  const handleSend = useCallback(() => {
    const content = text.trim();
    if (!content || disabled) return;
    notifyTyping(false);
    onSend(content, ephemeral);
    setText('');
    if (editorRef.current) editorRef.current.textContent = '';
  }, [text, ephemeral, onSend, disabled, notifyTyping]);

  const handleKeyDown = useCallback((e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }
    }
  }, [handleSend]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, pasted);
  }, []);

  const handleInput = useCallback((e) => {
    const value = e.currentTarget.textContent || '';
    setText(value);
    notifyTyping(value.trim().length > 0);
  }, [notifyTyping]);

  return (
    <div className="glass border-t border-glass-border px-4 py-3 flex items-end gap-3">
      <div className="flex-1 min-h-[40px]">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          data-placeholder="Type a message... (⌘+Enter to send)"
          className="font-body text-sm text-text-primary outline-none min-h-[24px] max-h-[120px] overflow-y-auto
                     before:content-[attr(data-placeholder)] before:text-text-placeholder before:pointer-events-none
                     empty:before:block before:hidden"
          style={{ wordBreak: 'break-word' }}
        />
      </div>

      <button
        onClick={() => setEphemeral(!ephemeral)}
        aria-label={ephemeral ? 'Disable ephemeral mode' : 'Enable ephemeral mode'}
        className={`p-1.5 rounded transition-all ${
          ephemeral
            ? 'text-danger-orange shadow-[0_0_8px_rgba(255,69,0,0.4)]'
            : 'text-text-meta hover:text-neon-cyan'
        }`}
        title={ephemeral ? 'Ephemeral mode ON' : 'Ephemeral mode OFF'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 16.9 19.32C18.55 17.68 19.2 14.84 17.66 11.2Z"/>
        </svg>
      </button>

      <button
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        aria-label="Send message"
        className="p-2 rounded-full bg-transparent border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-bg-void hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  );
}
