import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { User, Role } from "@/lib/domain";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: Role;
  }) => Promise<User>;
  logout: () => Promise<void>;
  /** Перечитать /auth/me (например, после подтверждения почты). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ user: User }>("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api.post<{ user: User }>("/auth/login", { email, password });
    setUser(r.user);
    return r.user;
  }, []);

  const register = useCallback(
    async (data: { email: string; password: string; name: string; role: Role }) => {
      const r = await api.post<{ user: User }>("/auth/register", data);
      setUser(r.user);
      return r.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await api.get<{ user: User }>("/auth/me");
      setUser(r.user);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри AuthProvider");
  return ctx;
}
