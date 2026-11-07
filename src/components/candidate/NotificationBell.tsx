import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Bell } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import { sortNewestFirst } from "@/services/notifications";
import { NotificationCategoryIcon } from "./NotificationCategoryIcon";
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

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
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

  const preview = sortNewestFirst(notifications).slice(0, 5);

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
              to="/can/notifications"
              className="notif-dropdown__view-all"
              onClick={() => setOpen(false)}
            >
              Xem tất cả
            </Link>
          </div>

          {/* List */}
          {preview.length > 0 ? (
            <ul className="notif-dropdown__list" role="list">
              {preview.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`notif-dropdown__item${n.read ? "" : " notif-dropdown__item--unread"}`}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
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
          {notifications.length > 0 && (
            <div className="notif-dropdown__footer">
              <Link
                to="/can/notifications"
                className="notif-dropdown__footer-link"
                onClick={() => setOpen(false)}
              >
                Xem tất cả {notifications.length} thông báo
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
