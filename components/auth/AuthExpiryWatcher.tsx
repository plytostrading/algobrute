'use client';

/**
 * AuthExpiryWatcher — mounts inside the authenticated app shell.
 *
 * Listens for the custom `auth:expired` DOM event that lib/api.ts dispatches
 * when a 401 response survives both a Bearer token attempt and a silent
 * refresh retry. On receipt: logs out, clears the query cache, and redirects
 * to /login.
 *
 * This keeps session expiry handling centralised without coupling lib/api.ts
 * to React hooks or the Next.js router.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/store/AuthContext';

export default function AuthExpiryWatcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  useEffect(() => {
    const handleExpiry = () => {
      void logout().finally(() => {
        queryClient.clear();
        router.replace('/login');
      });
    };

    window.addEventListener('auth:expired', handleExpiry);
    return () => window.removeEventListener('auth:expired', handleExpiry);
  }, [logout, queryClient, router]);

  return null;
}
