'use client';

/**
 * /notifications — full-page inbox for customer-facing qualification
 * notifications.
 *
 * Task #364 — companion to the AppHeader bell + dropdown.  Surfaces the
 * complete history of `qualification_notifications` for the
 * authenticated user with filter + mark-read affordances.
 *
 * Pattern parity
 * --------------
 *
 * Mirrors the dropdown's data path (`useNotificationsList` +
 * `useMarkNotificationRead` + `useMarkAllNotificationsRead`) but with a
 * larger page size (50) and a filter chip for "All" / "Unread only".
 * Clicking a row marks it read and navigates to its `action_url`
 * (when present); the page itself never mocks data.
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Inbox } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import type {
  NotificationItem,
  NotificationSeverity,
} from '@/types/api';

const PAGE_SIZE = 50;

type FilterMode = 'all' | 'unread';

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function severityBadgeClasses(severity: NotificationSeverity): string {
  switch (severity) {
    case 'success':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'warning':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'info':
    default:
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30';
  }
}

interface NotificationFullRowProps {
  notification: NotificationItem;
  onActivate: (notification: NotificationItem) => void;
  onMarkRead: (notification: NotificationItem) => void;
}

function NotificationFullRow({
  notification,
  onActivate,
  onMarkRead,
}: NotificationFullRowProps) {
  const isUnread = notification.read_at === null;
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 transition-colors',
        isUnread ? 'bg-accent/40' : 'bg-background',
      )}
    >
      <Badge
        variant="outline"
        className={cn(
          'mt-0.5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
          severityBadgeClasses(notification.severity),
        )}
      >
        {notification.severity}
      </Badge>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onActivate(notification)}
            className={cn(
              'min-w-0 truncate text-left text-sm hover:underline focus:underline focus:outline-none',
              isUnread ? 'font-semibold' : 'font-medium text-muted-foreground',
            )}
          >
            {notification.subject}
          </button>
        </div>
        <p
          className={cn(
            'mt-1 text-sm',
            isUnread ? 'text-foreground/90' : 'text-muted-foreground',
          )}
        >
          {notification.body}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatAbsolute(notification.created_at)}</span>
          {notification.action_label && notification.action_url && (
            <Button
              variant="link"
              size="sm"
              className="h-auto px-0 text-xs"
              onClick={() => onActivate(notification)}
            >
              {notification.action_label}
            </Button>
          )}
        </div>
      </div>
      {isUnread && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onMarkRead(notification)}
        >
          <Check className="mr-1 h-3 w-3" />
          Mark read
        </Button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterMode>('all');
  const listQuery = useNotificationsList(PAGE_SIZE, filter === 'unread');
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = listQuery.data?.items ?? [];
  const unreadCount = listQuery.data?.unread_count ?? 0;
  const total = listQuery.data?.total ?? 0;

  const headline = useMemo(() => {
    if (filter === 'unread') {
      return `${unreadCount} unread`;
    }
    if (total === 0) return 'No notifications yet';
    return `${total} total · ${unreadCount} unread`;
  }, [filter, total, unreadCount]);

  const handleActivate = (notification: NotificationItem) => {
    if (notification.read_at === null) {
      markRead.mutate(notification.id);
    }
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleMarkRead = (notification: NotificationItem) => {
    markRead.mutate(notification.id);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <p className="text-xs text-muted-foreground">{headline}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <Check className="mr-1 h-3 w-3" />
                Mark all read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {listQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <span>Could not load notifications.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void listQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Inbox className="h-6 w-6" />
              <span>
                {filter === 'unread'
                  ? 'You have no unread notifications.'
                  : 'You don’t have any notifications yet.'}
              </span>
            </div>
          ) : (
            items.map((notification) => (
              <NotificationFullRow
                key={notification.id}
                notification={notification}
                onActivate={handleActivate}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
