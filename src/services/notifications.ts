import { ApiError, parseApiResponse } from "./api.ts";
import { authenticatedFetch, authenticatedRequest } from "./auth.ts";

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
 * mock/UI shape (`title`, `message`, `read`, `category`). Entity ids are
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

/** Role context the notification was recorded under (backend `audience`). One account can be both a Candidate and a Recruiter, so each portal requests its own audience. Empty string when absent; parsers derive a fallback from the event key. */
export type NotificationAudience = "CANDIDATE" | "RECRUITER" | "";

export interface Notification {
  id: string;
  /** Backend event key, e.g. `APPLICATION_STATUS_CHANGED`. Empty when absent. */
  type: string;
  /** Role context the notification belongs to; `CANDIDATE` vs `RECRUITER`. */
  audience: NotificationAudience;
  category: NotificationCategory;
  title: string;
  body: string;
  /** ISO timestamp, or an empty string when the server omits it. */
  createdAt: string;
  read: boolean;
  readAt: string | null;
  action: NotificationAction | null;
  actor: NotificationActor | null;
  references: NotificationReferences;
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
 * Resolve a category from a backend event key when the payload has no explicit
 * category. Exact GuardianWork events are listed above; the prefixes keep
 * future events (e.g. `JOB_CLOSED`) working without a client release.
 */
export function categoryForType(type: string): NotificationCategory {
  const normalized = type.trim().toUpperCase();
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

/** Normalize one notification from an API or legacy fixture. */
export function parseNotification(value: unknown): Notification {
  const raw = asRecord(value);
  const id = idValue(raw?.id);
  if (!raw || !id) {
    throw new ApiError("Phản hồi thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }

  const type = textValue(raw.type ?? raw.kind ?? raw.eventType ?? raw.event_type);
  const audienceRaw = textValue(raw.audience).toUpperCase();
  // Backend always sends audience now; legacy rows fall back by event kind
  // (status/rejected are candidate-facing, everything else incl. withdrawn is recruiter-facing).
  const audience: NotificationAudience =
    audienceRaw === "CANDIDATE" || audienceRaw === "RECRUITER"
      ? audienceRaw
      : "APPLICATION_STATUS_CHANGED" === type.trim().toUpperCase() ||
          "APPLICATION_REJECTED" === type.trim().toUpperCase()
        ? "CANDIDATE"
        : "";
  const explicitCategory = textValue(raw.category).toLowerCase();
  const category = isNotificationCategory(explicitCategory)
    ? explicitCategory
    : categoryForType(type);
  const readAt = dateValue(raw.readAt ?? raw.read_at) || null;

  return {
    id,
    type,
    audience,
    category,
    title: textValue(raw.title),
    body: textValue(raw.body ?? raw.message ?? raw.content ?? raw.candidateFeedback) || "",
    createdAt: dateValue(raw.createdAt ?? raw.created_at ?? raw.occurredAt ?? raw.timestamp),
    read: booleanValue(raw.read ?? raw.isRead ?? raw.is_read) || readAt !== null,
    readAt,
    action: parseAction(raw),
    actor: parseActor(raw),
    references: parseReferences(raw),
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
/** Backend bounds page size to 20 (PaginationUtils.MAX_PAGE_SIZE); larger values clamp to 20. */
const MAX_NOTIFICATION_PAGE_SIZE = 20;

export interface NotificationQuery {
  page?: number;
  size?: number;
  /** `false` = unread only, `true` = read only, omitted = all (server filter). */
  read?: boolean;
  /** Wire category, e.g. `job` or `application` (server filter). */
  category?: NotificationCategory | string;
  /** Backend event key, e.g. `APPLICATION_REJECTED` (server filter). */
  eventType?: string;
  /** Role context, e.g. `CANDIDATE` or `RECRUITER` (server filter). */
  audience?: NotificationAudience | string;
  /** Numeric inbox id; return only rows with `id > sinceId` (polling). */
  sinceId?: number | string;
  signal?: AbortSignal;
}

export interface NotificationReadResponse {
  /**
   * Inbox id as a string, normalized from the backend number to match
   * {@link Notification.id}.
   */
  id: string;
  readAt: string;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationMarkAllReadResponse {
  /** Number of previously-unread rows changed by the batch. */
  updatedCount: number;
  readAt: string;
}

/**
 * One polling round of the inbox.
 *
 * `notModified` is the answer to a conditional request whose tag still matches:
 * the server sent no body, so the counters are unknown (`null`) and the client
 * keeps what it already holds.
 */
export interface NotificationSyncResult {
  /** Rows newer than the requested watermark, newest first. */
  items: Notification[];
  unreadCount: number | null;
  totalCount: number | null;
  /** Highest inbox id of the recipient; the watermark of the next round. */
  latestId: number | null;
  /** More rows existed than the round could carry; the view has to be reloaded. */
  hasMore: boolean;
  notModified: boolean;
  /** Entity tag of this round; sent back to make the next round conditional. */
  etag: string | null;
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
  if (query.read !== undefined) params.set("read", query.read ? "true" : "false");
  const category = textValue(query.category);
  if (category) params.set("category", category);
  const eventType = textValue(query.eventType);
  if (eventType) params.set("eventType", eventType);
  const audience = textValue(query.audience);
  if (audience) params.set("audience", audience);
  const sinceId = idValue(query.sinceId);
  if (sinceId) params.set("sinceId", sinceId);
  const data = await authenticatedRequest(`/me/notifications?${params.toString()}`, {
    signal: query.signal,
  });
  return parseNotificationPage(data);
}

/** Parse the GET /api/me/notifications/unread-count envelope (`{ data: { unreadCount } }`). */
export function parseUnreadCount(value: unknown): NotificationUnreadCountResponse {
  const record = value && typeof value === "object" ? (value as RawRecord) : null;
  const raw = record?.data ?? record;
  const count = Number((raw as RawRecord | null)?.unreadCount);
  if (!record || !Number.isFinite(count) || count < 0) {
    throw new ApiError("Phản hồi số lượng chưa đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  return { unreadCount: Math.trunc(count) };
}

/** Fetch the authoritative unread total for badge and tab counts. */
export async function getUnreadCount(
  audience?: NotificationAudience | string,
): Promise<NotificationUnreadCountResponse> {
  const normalized = textValue(audience);
  const query = normalized ? `?audience=${encodeURIComponent(normalized)}` : "";
  const data = await authenticatedRequest(`/me/notifications/unread-count${query}`);
  return parseUnreadCount(data);
}

/** Parse the GET /api/me/notifications/sync envelope. */
export function parseNotificationSyncResponse(
  value: unknown,
  etag: string | null = null,
): NotificationSyncResult {
  const raw = asRecord(value);
  if (!raw) {
    throw new ApiError("Phản hồi đồng bộ thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }
  const unread = Number(raw.unreadCount);
  const total = Number(raw.totalCount);
  if (!Number.isFinite(unread) || !Number.isFinite(total) || unread < 0 || total < 0) {
    throw new ApiError("Phản hồi đồng bộ thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }
  const latestRaw = raw.latestId;
  const latest = latestRaw === null || latestRaw === undefined ? null : Number(latestRaw);
  return {
    items: Array.isArray(raw.items) ? raw.items.map(parseNotification) : [],
    unreadCount: Math.trunc(unread),
    totalCount: Math.trunc(total),
    latestId: latest !== null && Number.isFinite(latest) ? Math.trunc(latest) : null,
    hasMore: raw.hasMore === true,
    notModified: false,
    etag,
  };
}

/**
 * One polling round of the inbox: the rows newer than the watermark plus the
 * counters of the inbox.
 *
 * The request is conditional when a tag is known: the server answers `304` when
 * nothing changed, and the client keeps what it holds.
 */
export async function syncNotifications(query: {
  audience?: NotificationAudience | string;
  sinceId?: number;
  etag?: string | null;
  limit?: number;
  signal?: AbortSignal;
}): Promise<NotificationSyncResult> {
  const params = new URLSearchParams();
  const audience = textValue(query.audience);
  if (audience) params.set("audience", audience);
  if (query.sinceId !== undefined && Number.isFinite(query.sinceId)) {
    params.set("sinceId", String(Math.trunc(query.sinceId)));
  }
  if (query.limit !== undefined && Number.isFinite(query.limit)) {
    params.set("limit", String(Math.trunc(query.limit)));
  }
  const headers: Record<string, string> = {};
  if (query.etag) headers["If-None-Match"] = query.etag;
  const response = await authenticatedFetch(`/me/notifications/sync?${params.toString()}`, {
    headers,
    signal: query.signal,
  });
  const etag = response.headers.get("ETag");
  if (response.status === 304) {
    return {
      items: [],
      unreadCount: null,
      totalCount: null,
      latestId: null,
      hasMore: false,
      notModified: true,
      etag,
    };
  }
  const data = await parseApiResponse(response);
  const record = asRecord(data);
  const payload = record && "data" in record && asRecord(record.data) ? record.data : data;
  return parseNotificationSyncResponse(payload, etag);
}

/** Fetch one recipient-owned notification (detail view / deep-link check). */
export async function getNotification(
  id: string,
  audience?: NotificationAudience | string,
): Promise<Notification> {
  const normalized = idValue(id);
  if (!normalized) {
    throw new ApiError("Phản hồi thông báo không hợp lệ. Vui lòng thử lại.", 500);
  }
  const aud = textValue(audience);
  const query = aud ? `?audience=${encodeURIComponent(aud)}` : "";
  const data = await authenticatedRequest(
    `/me/notifications/${encodeURIComponent(normalized)}${query}`,
  );
  const record = data && typeof data === "object" ? (data as RawRecord) : null;
  // `authenticatedRequest` unwraps `data`, but tolerate a double-wrapped envelope.
  const payload =
    record && "data" in record && asRecord((record as RawRecord).data)
      ? (record as RawRecord).data
      : data;
  return parseNotification(payload);
}

/** Mark a single notification read via PATCH /api/me/notifications/{id}/read. */
export async function markNotificationReadApi(
  id: string,
  audience?: NotificationAudience | string,
): Promise<NotificationReadResponse> {
  const aud = textValue(audience);
  const query = aud ? `?audience=${encodeURIComponent(aud)}` : "";
  const data = await authenticatedRequest(
    `/me/notifications/${encodeURIComponent(id)}/read${query}`,
    {
      method: "PATCH",
    },
  );
  if (!data || typeof data !== "object") {
    throw new ApiError("Phản hồi đánh dấu đã đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  const record = data as { id?: unknown; readAt?: unknown };
  const normalizedId = idValue(record.id);
  if (!normalizedId || typeof record.readAt !== "string") {
    throw new ApiError("Phản hồi đánh dấu đã đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  return { id: normalizedId, readAt: record.readAt };
}

/** Parse the PATCH /api/me/notifications/read envelope (`{ data: { updatedCount, readAt } }`). */
export function parseMarkAllReadResponse(value: unknown): NotificationMarkAllReadResponse {
  const record = value && typeof value === "object" ? (value as RawRecord) : null;
  const raw = record?.data ?? record;
  const updated = Number((raw as RawRecord | null)?.updatedCount);
  const readAt = dateValue((raw as RawRecord | null)?.readAt);
  if (!record || !Number.isFinite(updated) || updated < 0 || !readAt) {
    throw new ApiError("Phản hồi đánh dấu tất cả đã đọc không hợp lệ. Vui lòng thử lại.", 500);
  }
  return { updatedCount: Math.trunc(updated), readAt };
}

/** Mark every unread notification read in one request (replaces per-item fan-out). */
export async function markAllNotificationsReadApi(
  audience?: NotificationAudience | string,
): Promise<NotificationMarkAllReadResponse> {
  const normalized = textValue(audience);
  const query = normalized ? `?audience=${encodeURIComponent(normalized)}` : "";
  const data = await authenticatedRequest(`/me/notifications/read${query}`, { method: "PATCH" });
  return parseMarkAllReadResponse(data);
}

/** Portal a notification belongs to; drives {@link resolveNotificationPath}. */
export type NotificationPortal = "can" | "rec" | "staff";

/**
 * In-app destination for a notification, resolved from backend `action.href` to a
 * registered frontend route. Backend hrefs (`/jobs/{id}`, `/applications/{uuid}`,
 * `/companies/{id}`) are portal-agnostic and do not match TanStack routes, so each
 * portal maps them to its own list/detail screen. Returns `null` when there is no
 * known screen (informational-only, or a portal without one) — callers stay put.
 */
export type NotificationPath =
  | { to: "/jobs"; search: { job: string } }
  | { to: "/rec/jobs"; search: { jobId: number } }
  | { to: "/can/applied" }
  | { to: "/rec/applications" }
  | {
      to: "/rec/applications/$jobId/$applicationId";
      params: { jobId: string; applicationId: string };
    }
  | { to: "/rec/members" };

export function resolveNotificationPath(
  notification: Notification,
  portal: NotificationPortal,
): NotificationPath | null {
  const href = notification.action?.href?.trim() ?? "";
  if (!href || notification.action?.external) return null;
  const jobMatch = href.match(/^\/jobs\/(\d+)\/?$/);
  const applicationMatch = href.match(/^\/applications\/([^/?#]+)\/?$/);
  const companyMatch = href.match(/^\/companies\/(\d+)\/?$/);

  if (jobMatch) {
    const jobId = Number(jobMatch[1]);
    if (!Number.isSafeInteger(jobId) || jobId <= 0) return null;
    if (portal === "rec") return { to: "/rec/jobs", search: { jobId } };
    if (portal === "staff") return null;
    return { to: "/jobs", search: { job: String(jobId) } };
  }

  if (applicationMatch) {
    const applicationId = decodeURIComponent(applicationMatch[1]);
    if (portal === "rec") {
      const jobId = notification.references.job;
      if (jobId && /^\d+$/.test(jobId)) {
        return {
          to: "/rec/applications/$jobId/$applicationId",
          params: { jobId, applicationId },
        };
      }
      return { to: "/rec/applications" };
    }
    if (portal === "staff") return null;
    return { to: "/can/applied" };
  }

  if (companyMatch) {
    // No portal-owned company route; recruiter membership lands on the members page.
    return portal === "rec" ? { to: "/rec/members" } : null;
  }

  return null;
}
