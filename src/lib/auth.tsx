"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearTokens, hasToken, loadTokens, saveTokens } from "./api";
import type { TokenPair, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => Promise<void>;
  signOut: () => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    // defer state updates to a microtask so effects stay synchronous-free
    await Promise.resolve();
    if (!hasToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session hydration must happen once on mount
    void reloadUser();
  }, [reloadUser]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const tokens = await api<TokenPair>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
        auth: false,
      });
      saveTokens(tokens);
      const me = await api<User>("/auth/me");
      setUser(me);
    },
    [],
  );

  const signUp = useCallback(
    async (input: { email: string; username: string; password: string; full_name?: string }) => {
      const tokens = await api<TokenPair>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
        auth: false,
      });
      saveTokens(tokens);
      const me = await api<User>("/auth/me");
      setUser(me);
    },
    [],
  );

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, reloadUser }),
    [user, loading, signIn, signUp, signOut, reloadUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
