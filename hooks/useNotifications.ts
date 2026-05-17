'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { HttpError, apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { pollingIntervals, queryKeys } from '@/lib/queryKeys';
import type {
  NotificationListResponse,
  NotificationMarkReadResponse,
  NotificationUnreadCountResponse,
} from '@/types/api';

/**
 * Paginated list of the authenticated user's notifications.
 *
 * Refetches every 60s — the inbox is mostly background-driven (the bot
 * qualification subscriber writes rows asynchronously), so live cadence
 * is unnecessary.  The list payload also carries `unread_count` so the
 * bell badge stays in sync with the visible items on every refetch.
 *
 * @param limit  Maximum number of newest-first rows to return.  Capped
 *               server-side at 100.
 * @param unreadOnly  When `true`, only rows with `read_at IS NULL` are
 *               returned in `items`.  `unread_count` and `total` are
 *               always computed against the full inbox.
 */
export function useNotificationsList(
  limit: number = 20,
  unreadOnly: boolean = false,
) {
  return useQuery<NotificationListResponse>({
    queryKey: [...queryKeys.notifications.list(unreadOnly), limit],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit) });
      if (unreadOnly) params.set('unread_only', 'true');
      const res = await apiFetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) {
        const detail = await parseApiError(res, 'Failed to fetch notifications');
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<NotificationListResponse>(res);
    },
    refetchInterval: pollingIntervals.nearLive,
    staleTime: 30_000,
  });
}

/**
 * Lightweight unread-count for the bell badge.
 *
 * Polled at the `live` cadence (30s) so the bell stays responsive
 * without paying for the full list payload.  Backed by a single
 * `COUNT(*)` query on the engine side against the composite
 * `(user_id, created_at)` index, filtered to `read_at IS NULL`.
 */
export function useNotificationsUnreadCount() {
  return useQuery<NotificationUnreadCountResponse>({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const res = await apiFetch('/api/notifications/unread-count');
      if (!res.ok) {
        const detail = await parseApiError(
          res,
          'Failed to fetch notification unread count',
        );
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<NotificationUnreadCountResponse>(res);
    },
    refetchInterval: pollingIntervals.live,
    staleTime: 15_000,
  });
}

/**
 * Mark a single notification as read.
 *
 * Returns the `marked_read` count (0 if the row was already read or
 * the user does not own it; the endpoint returns 404 in the latter
 * case which becomes a thrown HttpError).  On success, invalidates
 * both the list and the unread-count queries so the bell badge and
 * dropdown update without waiting for the next poll.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationMarkReadResponse, Error, string>({
    mutationFn: async (notificationId: string) => {
      const res = await apiFetch(
        `/api/notifications/${notificationId}/read`,
        { method: 'POST' },
      );
      if (!res.ok) {
        const detail = await parseApiError(
          res,
          'Failed to mark notification read',
        );
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<NotificationMarkReadResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

/**
 * Mark every unread notification as read in one call.
 *
 * Idempotent: subsequent calls return `marked_read=0` if the inbox is
 * already fully read.  Invalidates both queries on success.
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation<NotificationMarkReadResponse, Error, void>({
    mutationFn: async () => {
      const res = await apiFetch('/api/notifications/read-all', {
        method: 'POST',
      });
      if (!res.ok) {
        const detail = await parseApiError(
          res,
          'Failed to mark all notifications read',
        );
        throw new HttpError(res.status, detail);
      }
      return parseApiJson<NotificationMarkReadResponse>(res);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
