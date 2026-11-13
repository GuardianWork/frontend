import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import {
  listNotifications,
  resolveNotificationPath,
  type Notification,
  type NotificationPortal,
} from "@/services/notifications";
import { NotificationCategoryIcon } from "./NotificationCategoryIcon";
import { navigateToPath } from "./notification-navigation";
import "./notification.css";

function relativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return mins <= 1 ? "vừa xong" : `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

function portalFromPathname(pathname: string): NotificationPortal {
  if (pathname.startsWith("/rec")) return "rec";
  if (pathname.startsWith("/staff")) return "staff";
  return "can";
}

export type NotificationInboxPath =
  "/can/notifications" | "/rec/notifications" | "/staff/notifications";

export function NotificationBell({
  viewAllTo = "/can/notifications",
}: {
  viewAllTo?: NotificationInboxPath;
}) {
  const { unreadCount, allCount, openNotification, audience } = useNotifications();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const portal = portalFromPathname(pathname);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Notification[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  // The bell preview is the newest unfiltered page for the current portal's
  // audience, fetched on open so it stays correct regardless of which tab
  // filter the inbox page last used.
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const page = await listNotifications({ page: 0, size: 5, audience });
      setPreview(page.items);
    } catch {
      // Keep the previous preview; the badge still reflects unread-count.
    } finally {
      setPreviewLoading(false);
    }
  }, [audience]);

  useEffect(() => {
    if (open) void fetchPreview();
  }, [open, fetchPreview]);

  async function handleOpen(item: Notification) {
    try {
      const detail = await openNotification(item.id);
      setPreview((prev) => prev.map((entry) => (entry.id === detail.id ? detail : entry)));
      const path = resolveNotificationPath(detail, portal);
      if (path) {
        navigateToPath(path, navigate);
        setOpen(false);
      } else {
        // Informational-only: mark read and confirm the new preview state.
        setPreview((prev) => prev.map((entry) => (entry.id === detail.id ? detail : entry)));
        setOpen(false);
      }
    } catch {
      // Stay in the dropdown so the user can retry.
    }
  }

  return (
    <div className="notif-bell" ref={containerRef}>
      <button
        id="notification-bell-btn"
        type="button"
        className="notif-bell__btn"
        aria-label={unreadCount > 0 ? `Thông báo — ${unreadCount} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notif-bell__badge" aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Thông báo gần đây"
          aria-modal="false"
          className="notif-dropdown"
          id="notification-dropdown"
        >
          {/* Header */}
          <div className="notif-dropdown__header">
            <h2 className="notif-dropdown__heading">
              Thông báo
              {unreadCount > 0 && <span className="notif-dropdown__count">{unreadCount}</span>}
            </h2>
            <Link
              to={viewAllTo}
              className="notif-dropdown__view-all"
              onClick={() => setOpen(false)}
            >
              Xem tất cả
            </Link>
          </div>

          {/* List */}
          {previewLoading && preview.length === 0 ? (
            <p className="notif-dropdown__empty">Đang tải…</p>
          ) : preview.length > 0 ? (
            <ul className="notif-dropdown__list" role="list">
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notif-dropdown__item${n.read ? "" : " notif-dropdown__item--unread"}`}
                    onClick={() => {
                      void handleOpen(n);
                    }}
                  >
                    <span className="notif-dropdown__icon">
                      <NotificationCategoryIcon category={n.category} size={17} />
                    </span>
                    <span className="notif-dropdown__body">
                      <span className="notif-dropdown__title">{n.title}</span>
                      <span className="notif-dropdown__desc">{n.body}</span>
                      <span className="notif-dropdown__time">{relativeTime(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notif-dropdown__empty">Chưa có thông báo nào.</p>
          )}

          {/* Footer */}
          {allCount > 0 && (
            <div className="notif-dropdown__footer">
              <Link
                to={viewAllTo}
                className="notif-dropdown__footer-link"
                onClick={() => setOpen(false)}
              >
                Xem tất cả {allCount} thông báo
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
