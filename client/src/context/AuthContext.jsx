import { createContext, useContext, useEffect, useState } from 'react';
import { me, logout as apiLogout } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = unauthenticated

  useEffect(() => {
    me()
      .then((userData) => setUser(userData))
      .catch(() => setUser(null));
  }, []);

  async function logout() {
    try {
      await apiLogout();
    } catch {
      // proceed regardless
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
