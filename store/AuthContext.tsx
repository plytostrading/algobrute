"use client";

/**
 * AuthContext — application-wide authentication state.
 *
 * - Access token lives in memory only (module-level via lib/api.ts).
 * - On mount the provider attempts a silent refresh using the httpOnly cookie.
 * - Exposes login(googleIdToken), logout(), isAuthenticated, and isLoading.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { setAccessToken } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean;
  /** True while the initial silent-refresh check is in progress. */
  isLoading: boolean;
  /** Exchange a Google ID token for an AlgoBrute session. */
  login: (googleIdToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthState | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Attempt silent refresh on first render — uses the httpOnly cookie.
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/auth/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = (await res.json()) as { access_token: string };
          setAccessToken(data.access_token);
          setIsAuthenticated(true);
        }
      } catch {
        // No valid session — user needs to log in.
      } finally {
        setIsLoading(false);
      }
    }
    void init();
  }, []);

  const login = useCallback(async (googleIdToken: string): Promise<void> => {
    const res = await fetch("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: googleIdToken }),
      credentials: "include",
    });

    if (!res.ok) {
      // Backend should return JSON (FastAPI), but in dev it's easy to end up with
      // a plain-text/HTML error body (e.g. "Internal Server Error").
      let detail: string | undefined;
      try {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const err = (await res.json()) as { detail?: string; message?: string };
          detail = err.detail ?? err.message;
        } else {
          const text = await res.text();
          detail = text?.trim() || undefined;
        }
      } catch {
        // ignore parse errors
      }

      throw new Error(detail ?? `Google login failed (${res.status})`);
    }

    const data = (await res.json()) as { access_token: string };
    setAccessToken(data.access_token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await fetch("/auth/logout", { method: "POST", credentials: "include" });
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

