import { ApiError } from "./api.ts";
import { authenticatedRequest } from "./auth.ts";

/**
 * Canonical, transport-agnostic notification model.
 *
 * The inbox is recipient-scoped — the API only returns notifications for the
 * signed-in user — so the model has no `audience` or `recipient` fields.
 * Delivery concerns such as email/push and retries belong to the backend
 * outbox, not to the item the UI renders.
 *
 * The parsers below accept both the GuardianWork `NotificationResponse` shape
 * (`eventType`, `companyId`, `applicationId`, `readAt`, ...) and the older
 * mock/UI shape (`title`, `message`, `read`, `category`). Event-specific values
 * that do not fit the envelope are kept in `data`, while entity ids are
 * normalized into `references`.
 */

export const NOTIFICATION_CATEGORIES = [
  "job",
  "application",
  "company",
  "account",
  "verification",
  "announcement",
  "community",
  "reward",
  "promotion",
  "system",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const NOTIFICATION_PRIORITIES = ["low", "normal", "high"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

/**
 * Entity ids the notification is about, keyed by entity type.
 * Known keys: `company`, `job`, `revision`, `application`, `user`.
 */
export type NotificationReferences = Record<string, string>;

export interface NotificationAction {
  /** Visible CTA label, or null when the UI should use its default copy. */
  label: string | null;
  /** In-app route or absolute URL. */
  href: string;
  external: boolean;
}

export interface NotificationActor {
  id: string | null;
  name: string;
  avatarUrl: string | null;
}

export interface Notification {
  id: string;
  /** Stable event key, e.g. `APPLICATION_STATUS_CHANGED`. Empty when absent. */
  kind: string;
  category: NotificationCategory;
  title: string;
  body: string;
  /** ISO timestamp, or an empty string when the server omits it. */
  createdAt: string;
  read: boolean;
  readAt: string | null;
  priority: NotificationPriority;
  action: NotificationAction | null;
  actor: NotificationActor | null;
  references: NotificationReferences;
  /** Event-specific payload for renderers, analytics, or future DTO fields. */
  data: Record<string, unknown>;
}

export interface NotificationPage {
  items: Notification[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  /** Server-reported total, or null when the endpoint does not report one. */
  unreadCount: number | null;
}

type RawRecord = Record<string, unknown>;

/** GuardianWork event keys mapped to the visual/filter category. */
const EVENT_CATEGORIES: Record<string, NotificationCategory> = {
  RECRUITER_ACCEPTED: "company",
  MEMBERSHIP_REMOVED: "company",
  JOB_ASSIGNED: "job",
  JOB_UNASSIGNED: "job",
  JOB_REVISION_APPROVED: "job",
  JOB_REVISION_REJECTED: "job",
  JOB_NEEDS_REASSIGNMENT: "job",
  APPLICATION_STATUS_CHANGED: "application",
  APPLICATION_REJECTED: "application",
  APPLICATION_WITHDRAWN: "application",
};

/** Display titles for event types when the server omits `title`. */
const EVENT_DISPLAY_TITLES: Record<string, string> = {
  RECRUITER_ACCEPTED: "Công ty đã chấp nhận thành viên",
  MEMBERSHIP_REMOVED: "Bạn đã bị xóa khỏi công ty",
  JOB_ASSIGNED: "Công việc được giao cho bạn",
  JOB_UNASSIGNED: "Công việc bị hủy giao",
  JOB_NEEDS_REASSIGNMENT: "Công việc cần phân công lại",
  JOB_REVISION_APPROVED: "Bản sửa đổi công việc đã được phê duyệt",
  JOB_REVISION_REJECTED: "Bản sửa đổi công việc bị từ chối",
  APPLICATION_STATUS_CHANGED: "Trạng thái đơn ứng tuyển đã thay đổi",
  APPLICATION_REJECTED: "Đơn ứng tuyển bị từ chối",
  APPLICATION_WITHDRAWN: "Hồ sơ ứng tuyển đã rút",
};

function asRecord(value: unknown): RawRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RawRecord) : null;
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function idValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function dateValue(value: unknown): string {
  const text = textValue(value);
  if (!text || Number.isNaN(Date.parse(text))) return "";
  return text;
}

function booleanValue(value: unknown): boolean {
  return value === true || value === "true";
}

function isNotificationCategory(value: string): value is NotificationCategory {
  return (NOTIFICATION_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Resolve a category from an event key when the payload has no explicit
 * category. Exact GuardianWork events are listed above; the prefixes keep
 * future events (e.g. `JOB_CLOSED`) working without a client release.
 */
export function categoryForKind(kind: string): NotificationCategory {
  const normalized = kind.trim().toUpperCase();
  if (!normalized) return "system";
  const exact = EVENT_CATEGORIES[normalized];
  if (exact) return exact;
  if (normalized.startsWith("APPLICATION_")) return "application";
  if (normalized.startsWith("JOB_")) return "job";
  if (normalized.startsWith("COMPANY_") || normalized.startsWith("MEMBERSHIP_")) return "company";
  if (normalized.startsWith("ACCOUNT_") || normalized.startsWith("USER_")) return "account";
  if (normalized.startsWith("VERIFICATION_")) return "verification";
  if (normalized.startsWith("REWARD_")) return "reward";
  if (normalized.startsWith("COMMUNITY_")) return "community";
  if (normalized.startsWith("PROMOTION_")) return "promotion";
  if (normalized.startsWith("ANNOUNCEMENT_")) return "announcement";
  return "system";
}

function parsePriority(value: unknown): NotificationPriority {
  const normalized = textValue(value).toLowerCase();
  if (normalized === "low" || normalized === "high") return normalized;
  if (normalized === "urgent" || normalized === "critical") return "high";
  return "normal";
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

function parseAction(raw: RawRecord): NotificationAction | null {
  const action = asRecord(raw.action);
  const href = textValue(
    action?.href ?? action?.url ?? action?.to ?? raw.actionUrl ?? raw.link ?? raw.url,
  );
  if (!href) return null;
  const label = textValue(action?.label ?? action?.title ?? raw.actionLabel ?? raw.linkLabel);
  const external = action?.external ?? raw.external;
  return {
    label: label || null,
    href,
    external: booleanValue(external) || isExternalHref(href),
  };
}

function parseActor(raw: RawRecord): NotificationActor | null {
  const actor = asRecord(raw.actor) ?? asRecord(raw.sender);
  const id = idValue(actor?.id ?? actor?.userId ?? raw.actorId ?? raw.senderId) || null;
  const name = textValue(
    actor?.name ?? actor?.displayName ?? actor?.fullName ?? raw.actorName ?? raw.senderName,
  );
  const avatarUrl = textValue(actor?.avatarUrl ?? actor?.avatar ?? raw.actorAvatarUrl) || null;
  if (!id && !name && !avatarUrl) return null;
  return { id, name, avatarUrl };
}

function setReference(references: NotificationReferences, key: string, value: unknown) {
  const normalized = idValue(value);
  if (normalized && !references[key]) references[key] = normalized;
}

function parseReferences(raw: RawRecord): NotificationReferences {
  const references: NotificationReferences = {};
  const provided = asRecord(raw.references) ?? asRecord(raw.entities);
  if (provided) {
    for (const [key, value] of Object.entries(provided)) {
      setReference(references, key, value);
    }
  }

  // GuardianWork `NotificationResponse` fields.
  setReference(references, "company", raw.companyId ?? raw.company_id);
  setReference(references, "job", raw.jobId ?? raw.job_id);
  setReference(references, "revision", raw.revisionId ?? raw.revision_id);
  setReference(references, "application", raw.applicationId ?? raw.application_id);

  // Generic `{ type, id }` target/subject used by other notification APIs.
  for (const candidate of [raw.target, raw.subject]) {
    const target = asRecord(candidate);
    if (!target) continue;
    const type = textValue(target.type).toLowerCase();
    if (type) setReference(references, type, target.id);
  }
  const targetType = textValue(raw.targetType).toLowerCase();
  if (targetType) setReference(references, targetType, raw.targetId);
  const subjectType = textValue(raw.subjectType).toLowerCase();
  if (subjectType) setReference(references, subjectType, raw.subjectId);

  return references;
}

function parseData(raw: RawRecord): Record<string, unknown> {
  const provided = asRecord(raw.data) ?? asRecord(raw.metadata);
  const data: Record<string, unknown> = provided ? { ...provided } : {};
  if (raw.companyName !== undefined && data.companyName === undefined)
    data.companyName = raw.companyName;
  if (raw.candidateFeedback !== undefined && data.candidateFeedback === undefined)
    data.candidateFeedback = raw.candidateFeedback;
  return data;
}

/** Normalize one notification from an API or legacy fixture. */
export function parseNotification(value: unknown): Notification {
  const raw = asRecord(value);
  const id = idValue(raw?.id);
  if (!raw || !id) {
    throw new ApiError("Phản hồi thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }

  const kind = textValue(raw.kind ?? raw.eventType ?? raw.event_type ?? raw.type);
  const explicitCategory = textValue(raw.category).toLowerCase();
  const category = isNotificationCategory(explicitCategory)
    ? explicitCategory
    : categoryForKind(kind);
  const readAt = dateValue(raw.readAt ?? raw.read_at) || null;

  return {
    id,
    kind,
    category,
    title: textValue(raw.title) || EVENT_DISPLAY_TITLES[kind] || "",
    body: textValue(raw.body ?? raw.message ?? raw.content ?? raw.candidateFeedback) || "",
    createdAt: dateValue(raw.createdAt ?? raw.created_at ?? raw.occurredAt ?? raw.timestamp),
    read: booleanValue(raw.read ?? raw.isRead ?? raw.is_read) || readAt !== null,
    readAt,
    priority: parsePriority(raw.priority),
    action: parseAction(raw),
    actor: parseActor(raw),
    references: parseReferences(raw),
    data: parseData(raw),
  };
}

function pageItems(page: RawRecord): unknown[] | null {
  for (const key of ["content", "items", "data"] as const) {
    if (Array.isArray(page[key])) return page[key] as unknown[];
  }
  return null;
}

/**
 * Normalize a `PageResponse`, an `{ items }`/`{ content }` wrapper, a bare
 * array, or a top-level `{ data: ... }` envelope. Like the application list
 * parser, a bare array is treated as a single page and its unread count is
 * left null because the caller cannot know whether it is complete.
 */
export function parseNotificationPage(value: unknown): NotificationPage {
  if (Array.isArray(value)) {
    const items = value.map(parseNotification);
    const pageSize = items.length || 20;
    return {
      items,
      pageNumber: 0,
      pageSize,
      totalElements: items.length,
      totalPages: 1,
      unreadCount: null,
    };
  }

  const outer = asRecord(value);
  const inner = outer ? asRecord(outer.data) : null;
  const page =
    outer && inner && !Array.isArray(outer.content) && !Array.isArray(outer.items) ? inner : outer;
  const source = page ? pageItems(page) : null;
  if (!page || !source) {
    throw new ApiError("Phản hồi danh sách thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }

  const items = source.map(parseNotification);
  const totalElements = Math.max(0, Number(page.totalElements ?? page.total ?? items.length) || 0);
  const pageSize = Math.max(1, Number(page.pageSize ?? page.size ?? (items.length || 20)) || 20);
  const totalPages = Math.max(
    1,
    Number(page.totalPages ?? Math.ceil(totalElements / pageSize)) || 1,
  );
  const pageNumber = Math.max(0, Number(page.pageNumber ?? page.page ?? page.number) || 0);
  const unreadRaw = page.unreadCount ?? page.unreadElements;
  const unreadCount =
    unreadRaw === undefined || unreadRaw === null ? null : Math.max(0, Number(unreadRaw) || 0);

  return { items, pageNumber, pageSize, totalElements, totalPages, unreadCount };
}

export function countUnread(items: readonly Notification[]): number {
  let count = 0;
  for (const item of items) if (!item.read) count += 1;
  return count;
}

function createdAtTime(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

/** Return a new array ordered newest-first; the input is not mutated. */
export function sortNewestFirst(items: readonly Notification[]): Notification[] {
  return [...items].sort((a, b) => createdAtTime(b.createdAt) - createdAtTime(a.createdAt));
}

/** Mark one item read, preserving an existing `readAt` timestamp. */
export function markNotificationRead(
  items: readonly Notification[],
  id: string,
  readAt = new Date().toISOString(),
): Notification[] {
  return items.map((item) => {
    if (item.id !== id || (item.read && item.readAt)) return item;
    return { ...item, read: true, readAt: item.readAt ?? readAt };
  });
}

/** Mark every unread item read, preserving existing `readAt` timestamps. */
export function markAllNotificationsRead(
  items: readonly Notification[],
  readAt = new Date().toISOString(),
): Notification[] {
  return items.map((item) =>
    item.read ? item : { ...item, read: true, readAt: item.readAt ?? readAt },
  );
}

const NOTIFICATION_PAGE_SIZE = 20;
const MAX_NOTIFICATION_PAGE_SIZE = 100;

export interface NotificationQuery {
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

export interface NotificationReadResponse {
  id: string;
  readAt: string;
}

function boundedPageSize(value: number | undefined): number {
  const num = typeof value === "number" && Number.isFinite(value) ? value : NOTIFICATION_PAGE_SIZE;
  return Math.min(MAX_NOTIFICATION_PAGE_SIZE, Math.max(1, Math.trunc(num)));
}

/** Fetch the signed-in recipient's inbox page from GET /api/me/notifications. */
export async function listNotifications(query: NotificationQuery = {}): Promise<NotificationPage> {
  const page = Math.max(0, Math.trunc(query.page ?? 0));
  const size = boundedPageSize(query.size);
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("size", String(size));
  const data = await authenticatedRequest(`/me/notifications?${params.toString()}`, {
    signal: query.signal,
  });
  return parseNotificationPage(data);
}

/** Mark a single notification read via PATCH /api/me/notifications/{id}/read. */
export async function markNotificationReadApi(id: string): Promise<NotificationReadResponse> {
  const data = await authenticatedRequest(`/me/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });
  if (!data || typeof data !== "object") {
    throw new ApiError("Phản hồi đánh dấu đã đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  const record = data as { id?: unknown; readAt?: unknown };
  if (typeof record.id !== "string" || typeof record.readAt !== "string") {
    throw new ApiError("Phản hồi đánh dấu đã đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  return { id: record.id, readAt: record.readAt };
}
