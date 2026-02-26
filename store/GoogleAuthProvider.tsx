"use client";

/**
 * GoogleAuthProvider
 *
 * Thin 'use client' wrapper around @react-oauth/google's GoogleOAuthProvider.
 * Must be rendered before any component that uses GoogleLogin or useGoogleLogin.
 */

import { GoogleOAuthProvider } from "@react-oauth/google";
import type { ReactNode } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function GoogleAuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>{children}</GoogleOAuthProvider>
  );
}

