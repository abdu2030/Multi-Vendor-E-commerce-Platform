import { apiRequest } from "./api";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ORDER" | "SELLER" | "ADMIN";

export type DashboardNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: DashboardNotification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const NOTIFICATIONS_UPDATED_EVENT = "marketo:notifications-updated";

export function getNotifications(
  accessToken: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const params = new URLSearchParams({
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 12),
    unreadOnly: String(options.unreadOnly ?? false)
  });

  return apiRequest<NotificationListResponse>(`/notifications?${params.toString()}`, {
    token: accessToken
  });
}

export function getUnreadNotificationCount(accessToken: string) {
  return apiRequest<{ unreadCount: number }>("/notifications/unread-count", {
    token: accessToken
  });
}

export function markNotificationRead(accessToken: string, notificationId: string) {
  return apiRequest<DashboardNotification>(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    token: accessToken
  });
}

export function markAllNotificationsRead(accessToken: string) {
  return apiRequest<{ updated: number; unreadCount: number }>("/notifications/read-all", {
    method: "PATCH",
    token: accessToken
  });
}

export function announceNotificationUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
  }
}
