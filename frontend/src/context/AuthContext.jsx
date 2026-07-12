import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [keyPair, setKeyPair] = useState(null);

  const signIn = useCallback((userData, kp) => {
    setUser(userData);
    setKeyPair(kp);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setKeyPair(null);
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