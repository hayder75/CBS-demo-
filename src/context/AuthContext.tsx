import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/client';
import type { Role, User } from '../types';

export class MfaRequiredError extends Error {
  username?: string;

  constructor(username?: string) {
    super('mfa-required');
    this.username = username;
  }
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (username: string, role: Role, password?: string) => Promise<User>;
  verifyMfa: (username: string, otp: string) => Promise<User>;
  switchRole: (role: Role) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => {
    throw new Error('not ready');
  },
  verifyMfa: async () => {
    throw new Error('not ready');
  },
  switchRole: async () => {
    throw new Error('not ready');
  },
  logout: () => {},
});

const SESSION_IDLE_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User | null>('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const adopt = (u: User) => {
    if (u.token) localStorage.setItem('cbs-token', u.token);
    setUser(u);
    return u;
  };

  const login = async (username: string, role: Role, password?: string) => {
    const result = await api<User | { mfaRequired?: boolean; username?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, role, password }),
    });
    if (result && typeof result === 'object' && 'mfaRequired' in result && result.mfaRequired) {
      throw new MfaRequiredError(result.username ?? username);
    }
    return adopt(result as User);
  };

  const verifyMfa = async (username: string, otp: string) => {
    const u = await api<User>('/api/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ username, otp }),
    });
    return adopt(u);
  };

  const switchRole = async (role: Role) => {
    const u = await api<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    return adopt(u);
  };

  const logout = () => {
    localStorage.removeItem('cbs-user');
    localStorage.removeItem('cbs-token');
    setUser(null);
  };

  useEffect(() => {
    if (!user) return;
    let timer: number | undefined;
    const reset = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => logout(), SESSION_IDLE_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((event) => window.addEventListener(event, reset));
    reset();
    return () => {
      if (timer) window.clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyMfa, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
