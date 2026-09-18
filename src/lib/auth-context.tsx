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
import { apiFetch, type AuthSession } from "@/lib/api";
import { mockSignIn } from "@/lib/mock-data";
import { USE_MOCK } from "@/lib/mock-mode";
import { PORTAL_BY_ROLE } from "@/lib/roles";

type AuthContextValue = {
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  refresh: () => Promise<AuthSession | null>;
  isMock: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "umbrella.session.v1";

function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

function setAuthCookie(active: boolean) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  if (active) {
    document.cookie = `umbrella_auth=1; path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure}`;
  } else {
    document.cookie = `umbrella_auth=; path=/; Max-Age=0; SameSite=Lax${secure}`;
  }
}

function persist(session: AuthSession | null) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setAuthCookie(true);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("umbrella.session");
    setAuthCookie(false);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  const applySession = useCallback((data: AuthSession) => {
    const normalized: AuthSession = {
      ...data,
      portal: data.portal ?? PORTAL_BY_ROLE[data.user.role],
    };
    persist(normalized);
    setSession(normalized);
    return normalized;
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (USE_MOCK) {
        return applySession(mockSignIn(email, password));
      }
      const data = await apiFetch<AuthSession>("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return applySession(data);
    },
    [applySession],
  );

  const refresh = useCallback(async () => {
    const current = readSession();
    if (!current?.refreshToken) return null;
    if (USE_MOCK) return applySession(current);
    try {
      const data = await apiFetch<AuthSession>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
      return applySession(data);
    } catch {
      persist(null);
      setSession(null);
      return null;
    }
  }, [applySession]);

  const signOut = useCallback(async () => {
    const current = readSession();
    if (!USE_MOCK && current?.accessToken) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          token: current.accessToken,
        });
      } catch {
        // clear local anyway
      }
    }
    persist(null);
    setSession(null);
  }, []);

  useEffect(() => {
    if (session?.refreshToken) setAuthCookie(true);
  }, [session]);

  const value = useMemo(
    () => ({ session, signIn, signOut, refresh, isMock: USE_MOCK }),
    [session, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
