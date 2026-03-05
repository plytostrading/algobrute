'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type { UserProfile } from '@/types/api';

/**
 * Authenticated user profile (email, expertise level, subscription tier).
 * Very stable — only refetches every 10 minutes.
 */
export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: queryKeys.user.profile,
    queryFn: async () => {
      const res = await apiFetch('/api/user/profile');
      if (!res.ok) throw new Error('Failed to fetch user profile');
      return parseApiJson<UserProfile>(res);
    },
    staleTime: pollingIntervals.slow,
    retry: 1,
  });
}
