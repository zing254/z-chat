import { createContext, useContext, useState, useCallback } from 'react';

const GhostModeContext = createContext(null);

export function GhostModeProvider({ children }) {
  const [ghostMode, setGhostMode] = useState(false);

  const toggleGhostMode = useCallback(() => {
    setGhostMode(prev => !prev);
  }, []);

  return (
    <GhostModeContext.Provider value={{ ghostMode, toggleGhostMode }}>
      {children}
    </GhostModeContext.Provider>
  );
}

export function useGhostMode() {
  return useContext(GhostModeContext);
}