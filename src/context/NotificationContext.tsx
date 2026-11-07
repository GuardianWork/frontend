/**
 * Notification state, backed by the /api/me/notifications backend.
 * The canonical model and parsers live in `@/services/notifications`;
 * this provider owns React state, loading, and error handling.
 *
 * Backend contract (docs/backend/notifications.md):
 *   GET    /api/me/notifications?page&size   → PageResponse<NotificationResponse>
 *   PATCH  /api/me/notifications/{id}/read   → NotificationReadResponse(id, readAt)
 *
 * Documented backend limitations are honored rather than worked around:
 *   - No mark-all-read endpoint  → markAllRead persists each unread item through
 *     the single-read endpoint in parallel.
 *   - No unread-count endpoint   → unreadCount is derived from the fetched page.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  countUnread,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationReadApi,
  parseNotificationPage,
  type Notification,
  type NotificationPage,
} from "@/services/notifications";
import { authenticatedRequest } from "@/services/auth";
import { ApiError } from "@/services/api";

const NOTIFICATION_PAGE_SIZE = 20;
const MAX_NOTIFICATION_PAGE_SIZE = 100;

interface NotificationQuery {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

type NotifContextType = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  retry: () => void;
};

const NotifContext = createContext<NotifContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => countUnread(notifications), [notifications]);

  const load = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", "0");
      params.set("size", String(NOTIFICATION_PAGE_SIZE));
      const page = await authenticatedRequest(`/me/notifications?${params.toString()}`, { signal });
      const parsed: NotificationPage = parseNotificationPage(page);
      setNotifications(parsed.items);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setError(
        cause instanceof Error ? cause.message : "Không tải được thông báo. Vui lòng thử lại.",
      );
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // The inbox is recipient-scoped and reloaded on mount; no polling interval
    // is configured on the frontend, so the effect needs no dependencies.
  }, [load]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString();
    // Optimistic update so the row reads as read immediately.
    setNotifications((prev) => markNotificationRead(prev, id, readAt));
    try {
      const result = await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, read: true, readAt: result.readAt ?? item.readAt } : item,
        ),
      );
    } catch (cause) {
      // Revert the optimistic update when the server rejects the read receipt.
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: false, readAt: null } : item)),
      );
      setError(cause instanceof Error ? cause.message : "Không đánh dấu đã đọc. Vui lòng thử lại.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    const readAt = new Date().toISOString();
    const previous = notifications;
    setNotifications((prev) => markAllNotificationsRead(prev, readAt));
    try {
      // No mark-all endpoint exists; persist each unread item individually.
      await Promise.all(unread.map((n) => markNotificationReadApi(n.id)));
    } catch (cause) {
      // Roll back to the exact pre-action state so the UI never claims
      // read state the server does not hold.
      setNotifications(previous);
      setError(
        cause instanceof Error ? cause.message : "Không đánh dấu tất cả đã đọc. Vui lòng thử lại.",
      );
    }
  }, [notifications]);

  return (
    <NotifContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        markRead,
        markAllRead,
        retry,
      }}
    >
      {children}
    </NotifContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
