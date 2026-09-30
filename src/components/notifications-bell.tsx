'use client';

/**
 * NotificationsBell — Polls /api/notifications every 10s, shows unread count,
 * and displays a dropdown panel with the latest notifications.
 *
 * Click bell to open/close. Click outside or on a notification to dismiss.
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, MessageSquare, Briefcase, CreditCard, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: 'mentor_message' | 'job_match' | 'payment' | 'system';
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, any> = {
  mentor_message: MessageSquare,
  job_match: Briefcase,
  payment: CreditCard,
  system: Sparkles,
};

const TYPE_COLOR: Record<string, string> = {
  mentor_message: 'text-blue-600 bg-blue-500/10',
  job_match: 'text-emerald-600 bg-emerald-500/10',
  payment: 'text-violet-600 bg-violet-500/10',
  system: 'text-amber-600 bg-amber-500/10',
};

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnread(data.unread || 0);
        }
      } catch {
        /* swallow */
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click — use click (not mousedown) to avoid races with toggle.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    // Bind on next tick so the same click that opened it doesn't immediately close it.
    const t = setTimeout(() => {
      document.addEventListener('click', handler);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('click', handler);
    };
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead' }),
      });
      setUnread(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* swallow */
    }
  };

  const handleClick = (n: Notification) => {
    if (n.link) {
      router.push(n.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef} style={{ zIndex: 60 }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="relative h-9 w-9 rounded-lg hover:bg-secondary flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-violet-500"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5 pointer-events-none" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-[10px] font-bold flex items-center justify-center pointer-events-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-[480px] overflow-hidden bg-card border rounded-lg shadow-xl flex flex-col"
          style={{ zIndex: 70 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((n) => {
                const Icon = TYPE_ICON[n.type] || Bell;
                const colorClass = TYPE_COLOR[n.type] || 'text-gray-600 bg-gray-500/10';
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-secondary/50 transition flex gap-3 ${
                      !n.read ? 'bg-violet-500/5' : ''
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center ${colorClass}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="font-medium text-sm flex-1 min-w-0">{n.title}</div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.body}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {timeAgo(n.createdAt)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t p-2 text-center flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {notifications.length} total · auto-refresh every 10s
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}