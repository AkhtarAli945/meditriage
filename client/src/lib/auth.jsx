import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'doctor' ? '/doctor' : '/app');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('mt_token')));

  useEffect(() => {
    if (!localStorage.getItem('mt_token')) return;
    api('/auth/me').then((d) => setUser(d.user)).catch(() => localStorage.removeItem('mt_token')).finally(() => setLoading(false));
  }, []);

  const finish = useCallback((d) => { localStorage.setItem('mt_token', d.token); setUser(d.user); return d.user; }, []);
  const login = useCallback(async (email, password) => finish(await api('/auth/login', { method: 'POST', body: { email, password } })), [finish]);
  const register = useCallback(async (form) => finish(await api('/auth/register', { method: 'POST', body: form })), [finish]);
  const logout = useCallback(() => { localStorage.removeItem('mt_token'); setUser(null); }, []);

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
