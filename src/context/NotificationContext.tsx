/**
 * Notification state, backed by the /api/me/notifications backend.
 * The canonical model and parsers live in `@/services/notifications`;
 * this provider owns React state, loading, error handling, server-side
 * tab filtering, unread counts, and polling.
 *
 * Backend contract (docs/backend/notifications.md + GW-SR-NOTIF-01):
 *   GET    /api/me/notifications?page&size&read&category&eventType&sinceId&audience → PageResponse<NotificationResponse>
 *   GET    /api/me/notifications/unread-count?audience=              → { unreadCount }
 *   GET    /api/me/notifications/{id}?audience=                      → NotificationResponse
 *   PATCH  /api/me/notifications/{id}/read?audience=                 → NotificationReadResponse(id, readAt)
 *   PATCH  /api/me/notifications/read?audience=                      → NotificationMarkAllReadResponse(updatedCount, readAt)
 *
 * Server-side behavior honored here:
 *   - Audience isolates portals: `/can` requests `CANDIDATE`, `/rec` requests `RECRUITER`
 *     (staff is unfiltered). A dual-role account no longer sees the other role's items.
 *   - Tabs fetch filtered pages (`read=false` for unread, `read=true` for read)
 *     instead of filtering one loaded page in the client.
 *   - Badge counts come from unread-count, not from counting loaded items.
 *   - Mark-all is a single PATCH, not one request per item.
 *   - A 30 s poll uses `sinceId` to fetch only items newer than the newest seen.
 */

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  getNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markAllNotificationsReadApi,
  markNotificationRead,
  markNotificationReadApi,
  type Notification,
  type NotificationAudience,
  type NotificationPage,
} from "@/services/notifications";

const INBOX_PAGE_SIZE = 20;
const POLL_INTERVAL_MS = 30_000;

export type NotificationTab = "all" | "unread" | "read";

function readFilterFor(tab: NotificationTab): boolean | undefined {
  if (tab === "unread") return false;
  if (tab === "read") return true;
  return undefined;
}

/** Audience for the current portal; `undefined` means unfiltered (staff). */
function audienceForPathname(pathname: string): NotificationAudience | undefined {
  if (pathname.startsWith("/rec")) return "RECRUITER";
  if (pathname.startsWith("/can")) return "CANDIDATE";
  return undefined;
}

/** Newest numeric inbox id in a list, or null when empty/non-numeric. */
function newestId(items: readonly Notification[]): number | null {
  let max: number | null = null;
  for (const item of items) {
    const num = Number(item.id);
    if (Number.isFinite(num) && num >= 0 && (max === null || num > max)) max = num;
  }
  return max;
}

function mergeNewestFirst(
  existing: readonly Notification[],
  incoming: readonly Notification[],
): Notification[] {
  if (incoming.length === 0) return [...existing];
  const known = new Set(existing.map((item) => item.id));
  const fresh = incoming.filter((item) => !known.has(item.id));
  return [...fresh, ...existing];
}

type NotifContextType = {
  /** Items of the current tab's loaded pages, newest first. */
  notifications: Notification[];
  /** Authoritative unread total from unread-count. */
  unreadCount: number;
  /** Unfiltered inbox total (all tab badge). */
  allCount: number;
  /** Derived read total for the read tab badge (`all - unread`). */
  readCount: number;
  /** Role context for the current portal (`CANDIDATE` in `/can`, `RECRUITER` in `/rec`). */
  audience: NotificationAudience | undefined;
  isLoading: boolean;
  error: string | null;
  activeTab: NotificationTab;
  setActiveTab: (tab: NotificationTab) => void;
  /** Whether another filtered page exists for the current tab. */
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Fetch one item's canonical detail, upsert it into the current view, and
   * mark it read when unread. Returns the post-mark notification so callers
   * can navigate to its `action.href`. Throws when the server rejects the fetch.
   */
  openNotification: (id: string) => Promise<Notification>;
  retry: () => void;
};

const NotifContext = createContext<NotifContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const audience = audienceForPathname(pathname);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Refs for the polling effect so it always reads the latest view without
  // re-subscribing the interval on every render.
  const tabRef = useRef(activeTab);
  tabRef.current = activeTab;
  const itemsRef = useRef(notifications);
  itemsRef.current = notifications;
  const loadingRef = useRef(isLoading);
  loadingRef.current = isLoading;
  const audienceRef = useRef(audience);
  audienceRef.current = audience;

  const hasMore = pageNumber < totalPages - 1;

  const refreshCounts = useCallback(
    async (aud: NotificationAudience | undefined, signal?: AbortSignal) => {
      const [unread, allPage] = await Promise.all([
        getUnreadCount(aud),
        listNotifications({ page: 0, size: 1, audience: aud, signal }),
      ]);
      setUnreadCount(unread.unreadCount);
      setAllCount(allPage.totalElements);
    },
    [],
  );

  const loadView = useCallback(
    async (
      tab: NotificationTab,
      page = 0,
      signal?: AbortSignal,
      append = false,
      aud: NotificationAudience | undefined = undefined,
    ) => {
      const result: NotificationPage = await listNotifications({
        page,
        size: INBOX_PAGE_SIZE,
        read: readFilterFor(tab),
        audience: aud,
        signal,
      });
      setNotifications((prev) =>
        append ? mergeNewestFirst(prev, result.items) : [...result.items],
      );
      setPageNumber(result.pageNumber);
      setTotalPages(result.totalPages);
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadView(activeTab, 0, controller.signal, false, audience),
          refreshCounts(audience, controller.signal),
        ]);
      } catch (cause) {
        if (cancelled) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(
          cause instanceof Error ? cause.message : "Không tải được thông báo. Vui lòng thử lại.",
        );
        setNotifications([]);
      } finally {
        if (!cancelled && !controller.signal.aborted) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeTab, audience, reloadNonce, loadView, refreshCounts]);

  // Poll for items newer than the newest seen in the current view. Badge counts
  // refresh even for tabs that correctly ignore new unread items (the read tab).
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.hidden || loadingRef.current) return;
      const cursor = newestId(itemsRef.current);
      void (async () => {
        try {
          const [result, unread, allPage] = await Promise.all([
            listNotifications({
              page: 0,
              size: INBOX_PAGE_SIZE,
              read: readFilterFor(tabRef.current),
              audience: audienceRef.current,
              sinceId: cursor ?? undefined,
            }),
            getUnreadCount(audienceRef.current),
            listNotifications({ page: 0, size: 1, audience: audienceRef.current }),
          ]);
          setNotifications((prev) => mergeNewestFirst(prev, result.items));
          setUnreadCount(unread.unreadCount);
          setAllCount(allPage.totalElements);
        } catch {
          // Transient poll failure; the next tick (or retry()) recovers.
        }
      })();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const retry = useCallback(() => {
    setReloadNonce((nonce) => nonce + 1);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    try {
      const next = pageNumber + 1;
      const result = await listNotifications({
        page: next,
        size: INBOX_PAGE_SIZE,
        read: readFilterFor(tabRef.current),
        audience: audienceRef.current,
      });
      setNotifications((prev) => mergeNewestFirst(prev, result.items));
      setPageNumber(result.pageNumber);
      setTotalPages(result.totalPages);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không tải thêm được thông báo. Vui lòng thử lại.",
      );
    } finally {
      loadingRef.current = false;
    }
  }, [hasMore, pageNumber]);

  const markRead = useCallback(
    async (id: string) => {
      const target = notifications.find((item) => item.id === id);
      if (!target || target.read) return;

      const readAt = new Date().toISOString();
      const wasUnread = !target.read;
      // Optimistic update so the row reads as read immediately.
      setNotifications((prev) => markNotificationRead(prev, id, readAt));
      if (wasUnread) setUnreadCount((count) => Math.max(0, count - 1));
      try {
        const result = await markNotificationReadApi(id, audienceRef.current);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, read: true, readAt: result.readAt ?? item.readAt } : item,
          ),
        );
        // In the unread-filtered view the row no longer matches; drop it locally
        // so the list agrees with the server filter until the next refresh.
        if (tabRef.current === "unread") {
          setNotifications((prev) => prev.filter((item) => item.id !== id));
        }
      } catch (cause) {
        // Revert the optimistic update when the server rejects the read receipt.
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, read: false, readAt: null } : item)),
        );
        if (wasUnread) setUnreadCount((count) => count + 1);
        setError(
          cause instanceof Error ? cause.message : "Không đánh dấu đã đọc. Vui lòng thử lại.",
        );
      }
    },
    [notifications],
  );

  const markAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const readAtLocal = new Date().toISOString();
    const previous = notifications;
    const previousUnread = unreadCount;
    setNotifications((prev) => markAllNotificationsRead(prev, readAtLocal));
    setUnreadCount(0);
    try {
      const receipt = await markAllNotificationsReadApi(audienceRef.current);
      setNotifications((prev) =>
        prev.map((item) =>
          item.read ? item : { ...item, read: true, readAt: receipt.readAt ?? item.readAt },
        ),
      );
      // In the unread-filtered view every row just left the filter.
      if (tabRef.current === "unread") setNotifications([]);
    } catch (cause) {
      // Roll back to the exact pre-action state so the UI never claims
      // read state the server does not hold.
      setNotifications(previous);
      setUnreadCount(previousUnread);
      setError(
        cause instanceof Error ? cause.message : "Không đánh dấu tất cả đã đọc. Vui lòng thử lại.",
      );
    }
  }, [notifications, unreadCount]);

  const openNotification = useCallback(async (id: string): Promise<Notification> => {
    let detail: Notification;
    try {
      detail = await getNotification(id, audienceRef.current);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không mở được thông báo. Vui lòng thử lại.",
      );
      throw cause;
    }
    // Upsert only when the item belongs to the current tab's filter.
    const matchesTab =
      tabRef.current === "all" ? true : tabRef.current === "unread" ? !detail.read : detail.read;
    setNotifications((prev) => {
      const exists = prev.some((item) => item.id === detail.id);
      if (!exists) return matchesTab ? [detail, ...prev] : prev;
      return prev.map((item) => (item.id === detail.id ? detail : item));
    });
    if (detail.read) return detail;
    const receipt = await markNotificationReadApi(detail.id, audienceRef.current);
    const marked: Notification = { ...detail, read: true, readAt: receipt.readAt };
    setNotifications((prev) => {
      const mapped = prev.map((item) => (item.id === marked.id ? marked : item));
      // A just-read item no longer belongs to the unread-filtered view.
      return tabRef.current === "unread" ? mapped.filter((item) => item.id !== marked.id) : mapped;
    });
    setUnreadCount((count) => Math.max(0, count - 1));
    return marked;
  }, []);

  const readCount = useMemo(() => Math.max(0, allCount - unreadCount), [allCount, unreadCount]);

  return (
    <NotifContext.Provider
      value={{
        notifications,
        unreadCount,
        allCount,
        readCount,
        audience,
        isLoading,
        error,
        activeTab,
        setActiveTab,
        hasMore,
        loadMore,
        markRead,
        markAllRead,
        openNotification,
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
