import { createContext, useContext, useState, useCallback, useRef } from 'react';

const TypingContext = createContext(null);

export function TypingProvider({ children }) {
  const [typing, setTyping] = useState({});
  const timers = useRef({});

  const setTypingFor = useCallback((userId, isTyping) => {
    const existing = timers.current[userId];
    if (existing) {
      clearTimeout(existing);
      delete timers.current[userId];
    }
    if (isTyping) {
      // Auto-clear after a short grace period if no further update arrives.
      timers.current[userId] = setTimeout(() => {
        setTyping((prev) => ({ ...prev, [userId]: false }));
        delete timers.current[userId];
      }, 4000);
    }
    setTyping((prev) => ({ ...prev, [userId]: isTyping }));
  }, []);

  return (
    <TypingContext.Provider value={{ typing, setTypingFor }}>
      {children}
    </TypingContext.Provider>
  );
}

export function useTyping() {
  return useContext(TypingContext);
}
