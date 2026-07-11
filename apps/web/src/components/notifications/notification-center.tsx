"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Package,
  RefreshCw,
  Shield,
  Truck
} from "@/components/imported/design-icons";
import {
  announceNotificationUpdate,
  DashboardNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NotificationListResponse,
  NotificationType
} from "@/lib/notifications";

const PAGE_SIZE = 12;

export function NotificationCenter() {
  const { accessToken, isLoading: authLoading, user } = useAuth();
  const [result, setResult] = useState<NotificationListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!accessToken) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setResult(await getNotifications(accessToken, { page, limit: PAGE_SIZE, unreadOnly }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notifications could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, unreadOnly]);

  const loadFirstPageNotifications = useCallback(async () => {
    if (!accessToken) {
      setResult(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setResult(await getNotifications(accessToken, { page: 1, limit: PAGE_SIZE, unreadOnly }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notifications could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, unreadOnly]);

  useEffect(() => {
    if (!authLoading) {
      void loadNotifications();
    }
  }, [authLoading, loadNotifications]);

  const markOneRead = async (notificationId: string) => {
    if (!accessToken) {
      return;
    }

    setBusyId(notificationId);
    setError(null);

    try {
      await markNotificationRead(accessToken, notificationId);
      await loadNotifications();
      announceNotificationUpdate();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notification could not be updated.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    if (!accessToken || !result?.unreadCount) {
      return;
    }

    setMarkingAll(true);
    setError(null);

    try {
      await markAllNotificationsRead(accessToken);
      setPage(1);
      await loadFirstPageNotifications();
      announceNotificationUpdate();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Notifications could not be updated.");
    } finally {
      setMarkingAll(false);
    }
  };

  if (authLoading || (isLoading && !result)) {
    return <NotificationLoading />;
  }

  const notifications = result?.notifications ?? [];
  const pagination = result?.pagination;

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              {user?.role === "SELLER" ? "Seller notifications" : "Buyer notifications"}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-stone-950">
              Notification center
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-500">
              Keep up with marketplace activity, orders, reviews, and account updates in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-extrabold text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              onClick={() => void loadNotifications()}
              type="button"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 text-sm font-extrabold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!result?.unreadCount || markingAll}
              onClick={() => void markAllRead()}
              type="button"
            >
              <CheckCircle className="h-4 w-4" />
              {markingAll ? "Updating..." : "Mark all read"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Unread" value={String(result?.unreadCount ?? 0)} Icon={Bell} />
        <Metric label="Showing" value={String(notifications.length)} Icon={Package} />
        <Metric label="Total" value={String(pagination?.total ?? 0)} Icon={Clock} />
      </div>

      <section className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-2xl bg-stone-100 p-1">
            {[
              { label: "All", value: false },
              { label: "Unread", value: true }
            ].map((filter) => (
              <button
                className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                  unreadOnly === filter.value
                    ? "bg-white text-stone-950 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                key={filter.label}
                onClick={() => {
                  setUnreadOnly(filter.value);
                  setPage(1);
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <p className="text-xs font-bold text-stone-400">
            Newest first | Page {pagination?.page ?? 1}
          </p>
        </div>
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      {isLoading && result ? (
        <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold text-stone-500">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
          Updating notifications...
        </div>
      ) : null}

      {!isLoading && notifications.length === 0 ? <EmptyNotifications unreadOnly={unreadOnly} /> : null}

      {notifications.length > 0 ? (
        <section className="grid gap-3" aria-live="polite">
          {notifications.map((notification) => (
            <NotificationCard
              busy={busyId === notification.id}
              key={notification.id}
              notification={notification}
              onMarkRead={markOneRead}
            />
          ))}
        </section>
      ) : null}

      {pagination && pagination.totalPages > 1 ? (
        <nav aria-label="Notification pages" className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <button
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-extrabold text-stone-700 disabled:opacity-40"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            Previous
          </button>
          <span className="text-xs font-extrabold text-stone-500">
            {page} of {pagination.totalPages}
          </span>
          <button
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-extrabold text-stone-700 disabled:opacity-40"
            disabled={page >= pagination.totalPages || isLoading}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}

function NotificationCard({
  notification,
  busy,
  onMarkRead
}: {
  notification: DashboardNotification;
  busy: boolean;
  onMarkRead: (id: string) => Promise<void>;
}) {
  const style = notificationStyle(notification.type);
  const Icon = style.Icon;
  const unread = !notification.readAt;

  return (
    <article className={`rounded-3xl border bg-white p-5 shadow-sm transition sm:p-6 ${unread ? "border-emerald-200 ring-1 ring-emerald-100" : "border-stone-200"}`}>
      <div className="flex items-start gap-4">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${style.iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${style.badgeClass}`}>
                  {notification.type.toLowerCase()}
                </span>
                {unread ? <span className="h-2 w-2 rounded-full bg-emerald-500" aria-label="Unread" /> : null}
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-stone-950">{notification.title}</h3>
            </div>
            <time className="text-xs font-bold text-stone-400" dateTime={notification.createdAt}>
              {formatNotificationDate(notification.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-7 text-stone-500">{notification.message}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-400">{unread ? "Unread" : "Read"}</span>
            {unread ? (
              <button
                className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                disabled={busy}
                onClick={() => void onMarkRead(notification.id)}
                type="button"
              >
                {busy ? "Updating..." : "Mark as read"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({ Icon, label, value }: { Icon: React.FC<{ className?: string }>; label: string; value: string }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-stone-400">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-stone-950">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </section>
  );
}

function EmptyNotifications({ unreadOnly }: { unreadOnly: boolean }) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
        <Bell className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-2xl font-extrabold text-stone-950">
        {unreadOnly ? "You are all caught up" : "No notifications yet"}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-stone-500">
        {unreadOnly
          ? "There are no unread marketplace updates."
          : "Order, seller, and account updates will appear here."}
      </p>
    </section>
  );
}

function NotificationLoading() {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-extrabold text-stone-600">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
        Loading notifications
      </div>
    </section>
  );
}

function notificationStyle(type: NotificationType) {
  const styles = {
    INFO: { Icon: Bell, iconClass: "bg-sky-50 text-sky-600", badgeClass: "bg-sky-50 text-sky-700" },
    SUCCESS: { Icon: CheckCircle, iconClass: "bg-emerald-50 text-emerald-600", badgeClass: "bg-emerald-50 text-emerald-700" },
    WARNING: { Icon: AlertTriangle, iconClass: "bg-amber-50 text-amber-600", badgeClass: "bg-amber-50 text-amber-700" },
    ORDER: { Icon: Truck, iconClass: "bg-indigo-50 text-indigo-600", badgeClass: "bg-indigo-50 text-indigo-700" },
    SELLER: { Icon: Package, iconClass: "bg-purple-50 text-purple-600", badgeClass: "bg-purple-50 text-purple-700" },
    ADMIN: { Icon: Shield, iconClass: "bg-stone-100 text-stone-700", badgeClass: "bg-stone-100 text-stone-700" }
  } satisfies Record<NotificationType, { Icon: React.FC<{ className?: string }>; iconClass: string; badgeClass: string }>;

  return styles[type];
}

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
