import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Role, User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, role: Role) => Promise<User>;
  switchRole: (role: Role) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('not ready');
  },
  switchRole: async () => {
    throw new Error('not ready');
  },
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User | null>('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, role: Role) => {
    const u = await api<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, role }),
    });
    if (u.token) localStorage.setItem('cbs-token', u.token);
    setUser(u);
    return u;
  };

  const switchRole = async (role: Role) => {
    const u = await api<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    if (u.token) localStorage.setItem('cbs-token', u.token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('cbs-user');
    localStorage.removeItem('cbs-token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);