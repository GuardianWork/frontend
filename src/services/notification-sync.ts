/**
 * Notification sync engine.
 *
 * The inbox is polled with an id watermark (`sinceId`) instead of refetching
 * page 0. This module owns that polling contract so it can be unit tested
 * without React:
 *
 * - one delta query per tick, **without** the active tab's `read` filter, so a
 *   new notification is detected no matter which tab the user is looking at;
 * - a per-audience watermark that only ever grows (inbox ids are assigned on
 *   insert, so a delayed dispatch can only ever produce a higher id);
 * - in-flight protection, exponential backoff, jitter and visibility-aware
 *   scheduling;
 * - an optional cross-tab channel so several open tabs do not all poll.
 *
 * The engine is transport agnostic: it delegates the two HTTP reads to a
 * {@link SyncFetcher} and reports what it learned through callbacks.
 */

import type { Notification } from "./notifications.ts";

/** Tabs of the inbox page; the engine itself is tab independent. */
export type SyncTab = "all" | "unread" | "read";

/** Authoritative counters for the badge and the tab badges. */
export interface SyncCounts {
  unreadCount: number;
  totalCount: number;
}

/**
 * One polling round answered by the server.
 *
 * `notModified` marks a conditional request that the server answered with
 * `304`: no body, no counters, nothing changed.
 */
export interface SyncResult {
  /** Rows newer than the watermark, newest first. */
  items: Notification[];
  /** Unknown (`null`) when the server answered `304`. */
  unreadCount: number | null;
  totalCount: number | null;
  /** Highest inbox id of the recipient. */
  latestId: number | null;
  /** More rows existed than the round could carry. */
  hasMore: boolean;
  notModified: boolean;
  /** Entity tag of the round; sent back to make the next round conditional. */
  etag: string | null;
}

export interface SyncFetcher {
  fetchSync(args: {
    audience?: string;
    sinceId?: number;
    etag?: string | null;
    signal?: AbortSignal;
  }): Promise<SyncResult>;
}

/** Minimal storage contract (session storage in the browser). */
export interface SyncStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Payload broadcast between tabs of the same origin. */
export interface SyncMessage {
  type: "result";
  audience?: string;
  items: Notification[];
  counts: SyncCounts;
  /** Entity tag of the round; a tab that adopts it can poll conditionally. */
  etag?: string | null;
  at: number;
}

export interface SyncChannel {
  post(message: SyncMessage): void;
  subscribe(handler: (message: SyncMessage) => void): () => void;
  close(): void;
}

export interface NotificationSyncOptions {
  fetcher: SyncFetcher;
  /** Role context of the inbox (`CANDIDATE` / `RECRUITER`); omitted = all. */
  audience?: string;
  /** New or updated items, newest first. */
  onItems: (items: Notification[], meta: { hasMore: boolean }) => void;
  onCounts: (counts: SyncCounts) => void;
  /** Called when the delta was truncated and the view has to be reloaded. */
  onResync?: () => void;
  onError?: (error: unknown) => void;
  /** Namespace of the persisted watermark; include the user id. */
  storageNamespace?: string;
  storage?: SyncStorage | null;
  channel?: SyncChannel | null;
  /** Poll delay while the user is active and the tab is visible. */
  baseIntervalMs?: number;
  /** Poll delay while the user is idle. */
  idleIntervalMs?: number;
  /** Idle is "no interaction for this long". */
  idleAfterMs?: number;
  /** Upper bound of the exponential backoff after failures. */
  maxBackoffMs?: number;
  /** Relative jitter applied to every delay (`0.2` = ±20%). */
  jitterRatio?: number;
  now?: () => number;
  random?: () => number;
  isVisible?: () => boolean;
  isIdle?: () => boolean;
  timers?: {
    setTimeout: (handler: () => void, timeout: number) => number;
    clearTimeout: (handle: number) => void;
  };
}

export interface NotificationSync {
  /** Begin polling. Safe to call twice. */
  start(): void;
  /** Stop polling and release timers, listeners and the channel. */
  stop(): void;
  /** Run a poll now (used on focus and on manual retry). */
  pollNow(): Promise<void>;
  /** Point the engine at another audience (portal switch). */
  setAudience(audience: string | undefined): void;
  /** Forget the persisted watermark; the next poll starts from the newest page. */
  reset(): void;
  /** Highest inbox id the engine already applied. */
  watermark(): number | undefined;
  /** True while a poll is in flight. */
  isPolling(): boolean;
}

export const DEFAULT_BASE_INTERVAL_MS = 20_000;
export const DEFAULT_IDLE_INTERVAL_MS = 60_000;
export const DEFAULT_IDLE_AFTER_MS = 5 * 60_000;
export const DEFAULT_MAX_BACKOFF_MS = 5 * 60_000;
export const DEFAULT_JITTER_RATIO = 0.2;

/** Numeric value of an inbox id; `null` when the id is not numeric. */
export function notificationIdValue(id: string): number | null {
  const value = Number(id);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Does the item belong to the given tab filter? */
export function matchesTab(item: Notification, tab: SyncTab): boolean {
  if (tab === "unread") return !item.read;
  if (tab === "read") return item.read;
  return true;
}

/**
 * Merge a delta into the current view.
 *
 * The server copy wins for known ids (it carries the authoritative read
 * state), items that no longer match the tab filter are dropped, and new items
 * are inserted in newest-first order.
 */
export function mergeNotificationItems(
  existing: readonly Notification[],
  incoming: readonly Notification[],
  tab: SyncTab,
): Notification[] {
  if (incoming.length === 0) return [...existing];
  const byId = new Map<string, Notification>();
  for (const item of existing) byId.set(item.id, item);
  for (const item of incoming) {
    if (matchesTab(item, tab)) byId.set(item.id, item);
    else byId.delete(item.id);
  }
  return [...byId.values()].sort(
    (a, b) => (notificationIdValue(b.id) ?? 0) - (notificationIdValue(a.id) ?? 0),
  );
}

/** Highest id of a batch, or `undefined` when the batch holds no numeric id. */
export function highestId(items: readonly Notification[]): number | undefined {
  let max: number | undefined;
  for (const item of items) {
    const value = notificationIdValue(item.id);
    if (value === null) continue;
    if (max === undefined || value > max) max = value;
  }
  return max;
}

/** Broadcast channel shared by the tabs of one origin; `null` when unsupported. */
export function createBroadcastSyncChannel(name: string): SyncChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  let channel: BroadcastChannel;
  try {
    channel = new BroadcastChannel(name);
  } catch {
    return null;
  }
  const handlers = new Set<(message: SyncMessage) => void>();
  channel.onmessage = (event: MessageEvent) => {
    const data = event.data as SyncMessage | null;
    if (!data || data.type !== "result") return;
    for (const handler of handlers) handler(data);
  };
  return {
    post(message) {
      try {
        channel.postMessage(message);
      } catch {
        // A closed channel must not break the poll.
      }
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    close() {
      handlers.clear();
      channel.close();
    },
  };
}

function defaultVisibility(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

class NotificationSyncEngine implements NotificationSync {
  private readonly options: NotificationSyncOptions;
  private readonly timers: {
    setTimeout: (handler: () => void, timeout: number) => number;
    clearTimeout: (handle: number) => void;
  };
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly isVisible: () => boolean;

  private audience: string | undefined;
  private running = false;
  private timer: number | null = null;
  private inFlight = false;
  private controller: AbortController | null = null;
  private failures = 0;
  private watermarkValue: number | undefined;
  /** Entity tag of the last round; makes the next request conditional. */
  private etag: string | null = null;
  private remoteAt = Number.NEGATIVE_INFINITY;
  private lastInteraction = 0;
  private unsubscribeChannel: (() => void) | null = null;
  private detachListeners: (() => void) | null = null;

  constructor(options: NotificationSyncOptions) {
    this.options = options;
    this.audience = options.audience;
    this.now = options.now ?? (() => Date.now());
    this.random = options.random ?? (() => Math.random());
    this.isVisible = options.isVisible ?? defaultVisibility;
    this.timers = options.timers ?? {
      setTimeout: (handler, timeout) =>
        globalThis.setTimeout(handler, timeout) as unknown as number,
      clearTimeout: (handle) => globalThis.clearTimeout(handle),
    };
    this.watermarkValue = this.readStoredWatermark();
  }

  // ---------------------------------------------------------------- lifecycle

  start(): void {
    if (this.running) return;
    this.running = true;
    this.failures = 0;
    this.lastInteraction = this.now();

    const channel = this.options.channel;
    if (channel) {
      this.unsubscribeChannel = channel.subscribe((message) => this.handleRemote(message));
    }
    this.attachListeners();
    this.schedule(this.nextDelay());
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.clearTimer();
    this.controller?.abort();
    this.controller = null;
    this.unsubscribeChannel?.();
    this.unsubscribeChannel = null;
    this.detachListeners?.();
    this.detachListeners = null;
  }

  setAudience(audience: string | undefined): void {
    if (this.audience === audience) return;
    this.audience = audience;
    this.controller?.abort();
    this.controller = null;
    this.watermarkValue = this.readStoredWatermark();
    if (!this.running) return;
    this.clearTimer();
    void this.pollNow();
  }

  reset(): void {
    this.watermarkValue = undefined;
    const key = this.storageKey();
    if (key && this.options.storage) this.options.storage.removeItem(key);
  }

  watermark(): number | undefined {
    return this.watermarkValue;
  }

  isPolling(): boolean {
    return this.inFlight;
  }

  // ------------------------------------------------------------------- polling

  async pollNow(): Promise<void> {
    if (!this.running || this.inFlight) return;
    this.clearTimer();
    await this.runPoll();
    if (this.running) this.schedule(this.nextDelay());
  }

  private async runPoll(): Promise<void> {
    if (this.inFlight) return;
    this.inFlight = true;
    const controller = new AbortController();
    this.controller = controller;
    const audience = this.audience;
    try {
      const sinceId = this.watermarkValue;
      const result = await this.options.fetcher.fetchSync({
        audience,
        sinceId,
        etag: this.etag,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      this.failures = 0;
      this.applyResult(audience, result, true);
    } catch (error) {
      if (isAbortError(error)) return;
      this.failures += 1;
      this.options.onError?.(error);
    } finally {
      this.inFlight = false;
      if (this.controller === controller) this.controller = null;
    }
  }

  private applyResult(audience: string | undefined, result: SyncResult, broadcast: boolean): void {
    // A conditional request that matched: the server sent no body and nothing
    // changed, so the client keeps the rows and the counters it holds.
    if (result.notModified) {
      if (result.etag) this.etag = result.etag;
      return;
    }
    if (result.etag) this.etag = result.etag;
    const items = result.items ?? [];
    // Only advance the watermark when the round was complete. A truncated round
    // would skip the rows that did not fit, so the view is reloaded instead.
    if (!result.hasMore) {
      const max = highestId(items);
      if (max !== undefined) this.setWatermark(max);
    }
    if (items.length > 0) this.options.onItems(items, { hasMore: result.hasMore });
    if (result.unreadCount !== null && result.totalCount !== null) {
      this.options.onCounts({ unreadCount: result.unreadCount, totalCount: result.totalCount });
    }
    if (result.hasMore) this.options.onResync?.();
    if (broadcast && result.unreadCount !== null && result.totalCount !== null) {
      this.options.channel?.post({
        type: "result",
        audience,
        items,
        counts: { unreadCount: result.unreadCount, totalCount: result.totalCount },
        etag: result.etag,
        at: this.now(),
      });
    }
  }

  private handleRemote(message: SyncMessage): void {
    if (!message || message.type !== "result") return;
    if ((message.audience ?? undefined) !== (this.audience ?? undefined)) return;
    this.remoteAt = this.now();
    if (message.etag) this.etag = message.etag;
    const items = message.items ?? [];
    if (items.length > 0) {
      const max = highestId(items);
      if (max !== undefined) this.setWatermark(max);
      this.options.onItems(items, { hasMore: false });
    }
    if (message.counts) this.options.onCounts(message.counts);
  }

  // ---------------------------------------------------------------- scheduling

  private schedule(delay: number): void {
    if (!this.running) return;
    this.clearTimer();
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      void this.tick();
    }, delay);
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    this.timers.clearTimeout(this.timer);
    this.timer = null;
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    if (!this.isVisible()) {
      // Hidden tabs do not poll; the visibility listener resumes the engine.
      this.schedule(this.nextDelay());
      return;
    }
    if (this.hasFreshRemoteResult()) {
      this.schedule(this.nextDelay());
      return;
    }
    await this.runPoll();
    if (this.running) this.schedule(this.nextDelay());
  }

  /** True when another tab delivered a result recently enough to skip this tick. */
  private hasFreshRemoteResult(): boolean {
    const suppression = (this.options.baseIntervalMs ?? DEFAULT_BASE_INTERVAL_MS) * 0.8;
    return this.now() - this.remoteAt < suppression;
  }

  private nextDelay(): number {
    const base = this.isIdle()
      ? (this.options.idleIntervalMs ?? DEFAULT_IDLE_INTERVAL_MS)
      : (this.options.baseIntervalMs ?? DEFAULT_BASE_INTERVAL_MS);
    // Exponential backoff after failures: 2x, 4x, 8x ... capped.
    const scaled =
      this.failures > 0
        ? Math.min(
            this.options.maxBackoffMs ?? DEFAULT_MAX_BACKOFF_MS,
            base * Math.pow(2, this.failures),
          )
        : base;
    const jitter = this.options.jitterRatio ?? DEFAULT_JITTER_RATIO;
    const spread = 1 + jitter * (this.random() * 2 - 1);
    return Math.max(1_000, Math.round(scaled * spread));
  }

  private isIdle(): boolean {
    if (this.options.isIdle) return this.options.isIdle();
    const idleAfter = this.options.idleAfterMs ?? DEFAULT_IDLE_AFTER_MS;
    return this.now() - this.lastInteraction > idleAfter;
  }

  // ------------------------------------------------------------------ storage

  private storageKey(): string | null {
    const namespace = this.options.storageNamespace;
    if (!namespace || !this.options.storage) return null;
    return `${namespace}:${this.audience ?? "all"}`;
  }

  private readStoredWatermark(): number | undefined {
    const key = this.storageKey();
    const storage = this.options.storage;
    if (!key || !storage) return undefined;
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }

  private setWatermark(value: number): void {
    if (this.watermarkValue !== undefined && value <= this.watermarkValue) return;
    this.watermarkValue = value;
    const key = this.storageKey();
    if (key && this.options.storage) this.options.storage.setItem(key, String(value));
  }

  // ---------------------------------------------------------------- listeners

  private attachListeners(): void {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") return;
      // Resume immediately: the badge may be stale after a background period.
      void this.pollNow();
    };
    const onInteraction = () => {
      this.lastInteraction = this.now();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("mousemove", onInteraction, { passive: true });
    window.addEventListener("keydown", onInteraction);
    window.addEventListener("click", onInteraction);
    window.addEventListener("scroll", onInteraction, { passive: true });
    this.detachListeners = () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("mousemove", onInteraction);
      window.removeEventListener("keydown", onInteraction);
      window.removeEventListener("click", onInteraction);
      window.removeEventListener("scroll", onInteraction);
    };
  }
}

/** Create a notification sync engine. */
export function createNotificationSync(options: NotificationSyncOptions): NotificationSync {
  return new NotificationSyncEngine(options);
}
