"use client";

/**
 * Login page — the only public route.
 *
 * Renders the Google Sign-In button. On success the GoogleLogin component
 * returns an ID token (credential) which is forwarded to the backend via
 * AuthContext.login(). After a successful login the user is redirected to /.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/store/AuthContext";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  // If already authenticated (e.g. page refresh with valid cookie), skip login.
  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.replace("/");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential) return;
    try {
      await auth.login(response.credential);
      router.replace("/");
    } catch (err) {
      console.error("Login failed:", err);
    }
  }

  // Show nothing while the silent-refresh check is in progress.
  if (auth.isLoading) return null;

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
          onError={() => console.error("Google OAuth failed")}
          useOneTap
        />
      </div>
    </div>
  );
}

