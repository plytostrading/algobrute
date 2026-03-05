"use client";

/**
 * Login page — the only public route.
 *
 * Renders the Google Sign-In button. On success the GoogleLogin component
 * returns an ID token (credential) which is forwarded to the backend via
 * AuthContext.login(). After a successful login the user is redirected to /.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/store/AuthContext";

function hasLoggedInCookie(): boolean {
  if (typeof document === "undefined") return false;
  // Cookie is intentionally lightweight and non-httpOnly; middleware relies on it.
  return document.cookie.split(";").some((c) => c.trim() === "logged_in=true");
}

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const cookieSaysLoggedIn = useMemo(() => hasLoggedInCookie(), []);

  // If already authenticated (e.g. refresh with valid cookie), skip login.
  // Guard against redirect loops when the in-memory token is set but the cookie is missing.
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated && cookieSaysLoggedIn) {
      router.replace("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, cookieSaysLoggedIn, router]);

  async function handleSuccess(response: CredentialResponse) {
    setError(null);
    if (!response.credential) return;
    try {
      await auth.login(response.credential);
      router.replace("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      console.error("Login failed:", err);
    }
  }

  // Avoid a totally blank white page while the silent-refresh check is in progress.
  if (auth.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-6 rounded-xl border bg-card p-10 shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to AlgoBrute
          </h1>
          <p className="text-sm text-muted-foreground">
            Regime-aware algorithmic trading
          </p>
        </div>

        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => {
            const msg =
              "Google sign-in failed. Ensure the OAuth client allows http://localhost:5173 as an authorized JavaScript origin.";
            setError(msg);
            console.error("Google OAuth failed");
          }}
        />

        {error && (
          <p className="max-w-sm text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
