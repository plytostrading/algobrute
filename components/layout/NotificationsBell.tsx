'use client';

/**
 * NotificationsBell — customer-facing notification surface in AppHeader.
 *
 * Task #364 — Renders a Bell icon with an unread-count badge.  Clicking
 * the bell opens a DropdownMenu populated by the recent contents of
 * `qualification_notifications` for the authenticated user.
 *
 * Behaviour
 * ---------
 *
 * - The unread badge polls every 30s via `useNotificationsUnreadCount`.
 * - Opening the dropdown lazily fetches the latest 10 rows via
 *   `useNotificationsList(10)` (refresh cadence 60s).
 * - Clicking an unread row marks it read AND navigates to its
 *   `action_url` (when present).
 * - Clicking a read row only navigates.
 * - A "Mark all read" affordance is rendered in the dropdown footer
 *   when any unread row is visible.
 *
 * Real-data discipline
 * --------------------
 *
 * Every render queries the live `/api/notifications` endpoint — there
 * is no synthetic dataset, no localStorage fallback, no SSR-only stub.
 * Aligns with the customer-facing-real-data invariant.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useNotificationsUnreadCount,
} from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import type {
  NotificationItem,
  NotificationSeverity,
} from '@/types/api';

const DROPDOWN_LIMIT = 10;

/**
 * Compact relative-time formatter ("3m ago", "2h ago", "Jan 12").
 *
 * Avoids pulling in `date-fns` for one helper.  Beyond 7 days we fall
 * back to an absolute date (locale-aware) since "X days ago" loses its
 * usefulness for stale notifications.
 */
function formatTimeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

function severityDotClass(severity: NotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'bg-emerald-500';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
    default:
      return 'bg-sky-500';
  }
}

interface NotificationRowProps {
  notification: NotificationItem;
  onActivate: (notification: NotificationItem) => void;
}

function NotificationRow({ notification, onActivate }: NotificationRowProps) {
  const isUnread = notification.read_at === null;
  return (
    <button
      type="button"
      onClick={() => onActivate(notification)}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
        'hover:bg-accent focus:bg-accent focus:outline-none',
        isUnread && 'bg-accent/40',
      )}
    >
      <span
        className={cn(
          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
          severityDotClass(notification.severity),
          !isUnread && 'opacity-30',
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm',
              isUnread ? 'font-semibold' : 'font-medium text-muted-foreground',
            )}
          >
            {notification.subject}
          </span>
        </div>
        <p
          className={cn(
            'line-clamp-2 text-xs',
            isUnread ? 'text-foreground/80' : 'text-muted-foreground',
          )}
        >
          {notification.body}
        </p>
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{formatTimeAgo(notification.created_at)}</span>
          {notification.action_label && (
            <span className="font-medium text-foreground/70">
              {notification.action_label}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The unread-count poll is always on so the badge stays fresh
  // independently of whether the dropdown is open.
  const unreadCountQuery = useNotificationsUnreadCount();

  // The list query is only enabled while the dropdown is open — there
  // is no need to fetch the rendered rows in the background.  React
  // Query handles cache-hydration on subsequent opens.
  const listQuery = useNotificationsList(DROPDOWN_LIMIT, false);

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = unreadCountQuery.data?.unread_count ?? 0;
  const items = listQuery.data?.items ?? [];

  const handleActivate = (notification: NotificationItem) => {
    setOpen(false);
    if (notification.read_at === null) {
      markRead.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
              aria-label={
                unreadCount > 0
                  ? `Notifications (${unreadCount} unread)`
                  : 'Notifications'
              }
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] leading-none"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleMarkAll}
              disabled={markAllRead.isPending}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[24rem]">
          <div className="p-1">
            {listQuery.isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : listQuery.isError ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground">
                <span>Could not load notifications.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => void listQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground">
                <Inbox className="h-5 w-5" />
                <span>You&apos;re all caught up.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {items.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    onActivate={handleActivate}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        {items.length > 0 && (
          <>
            <Separator />
            <div className="px-2 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={() => {
                  setOpen(false);
                  router.push('/notifications');
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
