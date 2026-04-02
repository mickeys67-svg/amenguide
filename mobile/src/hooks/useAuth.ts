import { useState, useEffect, useCallback } from 'react';
import { AuthUser, getToken, getUser, setToken, setUser, clearAuth } from '../utils/auth';
import { apiFetch } from '../utils/api';

export function useAuth() {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([getToken(), getUser()]);
      setTokenState(t);
      setUserState(u);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(res.token);
    await setUser(res.user);
    setTokenState(res.token);
    setUserState(res.user);
    return res;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiFetch<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    await setToken(res.token);
    await setUser(res.user);
    setTokenState(res.token);
    setUserState(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setTokenState(null);
    setUserState(null);
  }, []);

  const refresh = useCallback(async () => {
    const t = await getToken();
    if (!t) return;
    try {
      const u = await apiFetch<AuthUser>('/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      await setUser(u);
      setUserState(u);
    } catch {
      await clearAuth();
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  return { user, token, loading, login, register, logout, refresh, isLoggedIn: !!token };
}
