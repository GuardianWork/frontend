import { useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, Bell, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/NotificationContext";
import {
  sortNewestFirst,
  type Notification,
  type NotificationCategory,
} from "@/services/notifications";
import { NotificationCategoryIcon } from "./NotificationCategoryIcon";
import "./notification.css";

type TabKey = "all" | "unread" | "read";

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  job: "Việc làm",
  application: "Ứng tuyển",
  company: "Công ty",
  account: "Tài khoản",
  verification: "Xác minh",
  announcement: "Thông báo",
  community: "Cộng đồng",
  reward: "Thưởng",
  promotion: "Ưu đãi",
  system: "Hệ thống",
};

const GROUP_ORDER = ["Hôm nay", "Hôm qua", "Tuần này", "Trước đó"] as const;
type GroupLabel = (typeof GROUP_ORDER)[number];

function relativeTime(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

function groupLabel(iso: string): GroupLabel {
  const time = Date.parse(iso);
  if (!iso || Number.isNaN(time)) return "Trước đó";
  const now = new Date();
  const created = new Date(time);
  if (created.toDateString() === now.toDateString()) return "Hôm nay";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (created.toDateString() === yesterday.toDateString()) return "Hôm qua";
  if (Date.now() - time < 7 * 24 * 3600 * 1000) return "Tuần này";
  return "Trước đó";
}

function groupItems(items: Notification[]): Array<{ label: GroupLabel; items: Notification[] }> {
  const byLabel = new Map<GroupLabel, Notification[]>();
  for (const item of items) {
    const label = groupLabel(item.createdAt);
    const bucket = byLabel.get(label);
    if (bucket) bucket.push(item);
    else byLabel.set(label, [item]);
  }
  return GROUP_ORDER.filter((label) => byLabel.has(label)).map((label) => ({
    label,
    items: byLabel.get(label) ?? [],
  }));
}

export function NotificationPage() {
  const { notifications, unreadCount, isLoading, error, markRead, markAllRead, retry } =
    useNotifications();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [focusTarget, setFocusTarget] = useState<string | null>(null);

  // A notification feed reads newest-first; keep the provider order untouched.
  const sorted = sortNewestFirst(notifications);
  const filtered =
    activeTab === "all"
      ? sorted
      : activeTab === "unread"
        ? sorted.filter((n) => !n.read)
        : sorted.filter((n) => n.read);

  const groups = useMemo(() => groupItems(filtered), [filtered]);

  const readCount = notifications.filter((n) => n.read).length;
  const hasUnread = unreadCount > 0;

  const tabLabel: Record<TabKey, string> = {
    all: "Tất cả",
    unread: "Chưa xem",
    read: "Đã xem",
  };
  const tabCount: Record<TabKey, number> = {
    all: notifications.length,
    unread: unreadCount,
    read: readCount,
  };
  const tabs: TabKey[] = ["all", "unread", "read"];

  // Read rows are static, so hand keyboard focus to the next unread row (or the
  // active tab when the list empties) instead of dropping it on <body>.
  useEffect(() => {
    if (!focusTarget) return;
    document.getElementById(focusTarget)?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  function handleMarkRead(id: string) {
    const index = filtered.findIndex((n) => n.id === id);
    const next = [...filtered.slice(index + 1), ...filtered.slice(0, index)].find((n) => !n.read);
    markRead(id);
    setFocusTarget(next ? `notif-item-${next.id}` : `notif-tab-${activeTab}`);
  }

  function renderItem(n: Notification) {
    const content = (
      <>
        <span className="notif-icon-wrap" data-category={n.category}>
          <NotificationCategoryIcon category={n.category} size={20} />
        </span>
        <span className="notif-body">
          <span className="notif-topline">
            <span className="notif-category">{CATEGORY_LABELS[n.category]}</span>
            {!n.read && (
              <span className="notif-unread-pill">
                <span className="notif-unread-pill__dot" aria-hidden="true" />
                Chưa đọc
              </span>
            )}
          </span>
          <span className="notif-title">{n.title}</span>
          <span className="notif-desc">{n.body}</span>
          <span className="notif-meta">
            <time className="notif-time" dateTime={n.createdAt}>
              {relativeTime(n.createdAt)}
            </time>
            {!n.read && (
              <span className="notif-mark">
                <Check size={13} aria-hidden="true" />
                Đánh dấu đã đọc
              </span>
            )}
          </span>
        </span>
      </>
    );

    return (
      <li key={n.id}>
        {n.read ? (
          <div className="notif-item">{content}</div>
        ) : (
          <button
            type="button"
            id={`notif-item-${n.id}`}
            className="notif-item notif-item--unread"
            onClick={() => handleMarkRead(n.id)}
          >
            {content}
          </button>
        )}
      </li>
    );
  }

  return (
    <section className="notif-page" aria-labelledby="notif-heading">
      <header className="workspace-heading notif-header">
        <div>
          <h1 id="notif-heading">Thông báo</h1>
          <p>
            {isLoading && notifications.length === 0
              ? "Đang tải thông báo…"
              : error
                ? "Không tải được thông báo."
                : unreadCount > 0
                  ? `Bạn có ${unreadCount} thông báo chưa đọc.`
                  : "Bạn đã đọc hết tất cả thông báo."}
          </p>
        </div>
        <div className="notif-header__actions">
          {!isLoading && (
            <button
              type="button"
              id="notif-mark-all-btn"
              className="workspace-header-action notif-mark-all"
              onClick={() => {
                void markAllRead();
                setFocusTarget(`notif-tab-${activeTab}`);
              }}
              disabled={!hasUnread}
            >
              <CheckCheck size={17} aria-hidden="true" />
              Đánh dấu tất cả là đã đọc
            </button>
          )}
          {error && (
            <button
              type="button"
              className="workspace-header-action"
              onClick={() => {
                retry();
                setFocusTarget(null);
              }}
            >
              Thử lại
            </button>
          )}
        </div>
      </header>

      {isLoading && notifications.length === 0 ? null : (
        <>
          {error ? (
            <div className="notif-empty" role="status" aria-live="polite">
              <span className="notif-empty__icon" aria-hidden="true">
                <Bell size={24} />
              </span>
              <p className="notif-empty__title">Không tải được thông báo.</p>
              <p className="notif-empty__desc">{error}</p>
              <button
                type="button"
                className="workspace-header-action"
                onClick={() => {
                  retry();
                  setFocusTarget(null);
                }}
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              <div role="group" aria-label="Lọc thông báo" className="notif-tabs" id="notif-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    id={`notif-tab-${tab}`}
                    type="button"
                    className="notif-tab"
                    aria-pressed={activeTab === tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tabLabel[tab]}
                    {tabCount[tab] > 0 && (
                      <span className="notif-tab__badge" aria-label={`${tabCount[tab]} thông báo`}>
                        {tabCount[tab]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {filtered.length > 0 ? (
                <>
                  <div className="notif-list-meta">
                    <p className="notif-count" role="status">
                      {filtered.length} thông báo
                      {unreadCount > 0 && ` · ${unreadCount} chưa đọc`}
                    </p>
                    <span className="notif-order">
                      <ArrowDownWideNarrow size={14} aria-hidden="true" />
                      Mới nhất trước
                    </span>
                  </div>
                  <div className="notif-groups">
                    {groups.map((group) => (
                      <section
                        key={group.label}
                        aria-label={`${group.label} — ${group.items.length} thông báo`}
                      >
                        <h2 className="notif-group-heading">
                          {group.label}
                          <span
                            className="notif-group-count"
                            aria-label={`${group.items.length} thông báo`}
                          >
                            {group.items.length}
                          </span>
                        </h2>
                        <ul
                          className="notif-list"
                          aria-label={`Thông báo — ${tabLabel[activeTab]} — ${group.label}`}
                        >
                          {group.items.map(renderItem)}
                        </ul>
                      </section>
                    ))}
                  </div>
                </>
              ) : (
                <div className="notif-empty" role="status" aria-live="polite">
                  <span className="notif-empty__icon" aria-hidden="true">
                    <Bell size={24} />
                  </span>
                  <p className="notif-empty__title">
                    {activeTab === "unread"
                      ? "Không có thông báo chưa đọc"
                      : activeTab === "read"
                        ? "Chưa có thông báo nào đã đọc"
                        : "Chưa có thông báo nào"}
                  </p>
                  <p className="notif-empty__desc">
                    {activeTab === "unread"
                      ? "Bạn đã đọc hết tất cả thông báo. Rất tuyệt!"
                      : "Thông báo về tin tuyển dụng, hoạt động tài khoản và cập nhật sẽ xuất hiện tại đây."}
                  </p>
                  {activeTab !== "all" && (
                    <button
                      type="button"
                      className="workspace-header-action"
                      onClick={() => setActiveTab("all")}
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
