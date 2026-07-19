import { createContext, useContext, useState, useCallback } from 'react';
import { clearKeyPair } from '../lib/store/keyStore';

const AUTH_STORAGE_KEY = 'zchat_user';

function loadPersistedUser() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadPersistedUser());
  const [keyPair, setKeyPair] = useState(null);

  const signIn = useCallback((userData, kp) => {
    setUser(userData);
    setKeyPair(kp);
    if (userData) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      } catch {
        /* storage unavailable — session stays in-memory */
      }
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setKeyPair(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    clearKeyPair();
  }, []);

  return (
    <AuthContext.Provider value={{ user, keyPair, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
