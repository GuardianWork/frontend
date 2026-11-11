import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createNotificationSync,
  highestId,
  matchesTab,
  mergeNotificationItems,
} from "./notification-sync.ts";

const ISO = "2026-11-06T09:00:00.000Z";

function notification(id, overrides = {}) {
  return {
    id: String(id),
    type: "APPLICATION_STATUS_CHANGED",
    audience: "CANDIDATE",
    category: "application",
    title: `Title ${id}`,
    body: `Body ${id}`,
    createdAt: ISO,
    read: false,
    readAt: null,
    action: null,
    actor: null,
    references: {},
    ...overrides,
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function createStorage() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

function createFetcher() {
  const calls = { sync: [] };
  let result = {
    items: [],
    unreadCount: 0,
    totalCount: 0,
    latestId: null,
    hasMore: false,
    notModified: false,
    etag: null,
  };
  let failure = null;
  return {
    calls,
    setResult(value) {
      result = { ...result, ...value };
    },
    failWith(error) {
      failure = error;
    },
    fetchSync: async (args) => {
      calls.sync.push(args);
      if (failure) throw failure;
      return result;
    },
  };
}

function createChannel() {
  const handlers = new Set();
  const posted = [];
  return {
    posted,
    post(message) {
      posted.push(message);
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {},
    emit(message) {
      for (const handler of handlers) handler(message);
    },
  };
}

/** Deterministic clock with a virtual timer queue. */
function createClock() {
  let current = 0;
  let nextId = 1;
  const pending = new Map();
  const delays = [];
  return {
    now: () => current,
    delays,
    lastDelay: () => delays[delays.length - 1],
    timers: {
      setTimeout(handler, timeout) {
        const id = nextId++;
        delays.push(timeout);
        pending.set(id, { handler, at: current + timeout });
        return id;
      },
      clearTimeout(handle) {
        pending.delete(handle);
      },
    },
    async advance(ms) {
      current += ms;
      for (const [id, entry] of [...pending.entries()]) {
        if (entry.at <= current) {
          pending.delete(id);
          entry.handler();
        }
      }
      await flush();
    },
  };
}

function createEngine(overrides = {}, seed = {}) {
  const clock = createClock();
  const fetcher = createFetcher();
  const storage = createStorage();
  for (const [key, value] of Object.entries(seed)) storage.setItem(key, value);
  const channel = createChannel();
  const applied = { items: [], counts: [], resyncs: 0, errors: [] };
  const engine = createNotificationSync({
    fetcher,
    audience: "CANDIDATE",
    storageNamespace: "gw:notification-sync:7",
    storage,
    channel,
    baseIntervalMs: 1_000,
    idleIntervalMs: 1_000,
    maxBackoffMs: 8_000,
    jitterRatio: 0,
    now: () => clock.now(),
    random: () => 0.5,
    timers: clock.timers,
    onItems: (items) => {
      applied.items.push(...items);
    },
    onCounts: (counts) => {
      applied.counts.push(counts);
    },
    onResync: () => {
      applied.resyncs += 1;
    },
    onError: (error) => {
      applied.errors.push(error);
    },
    ...overrides,
  });
  return { engine, clock, fetcher, storage, channel, applied };
}

test("matchesTab only accepts items of the requested filter", () => {
  const unread = notification(1);
  const read = notification(2, { read: true, readAt: ISO });

  assert.equal(matchesTab(unread, "all"), true);
  assert.equal(matchesTab(read, "all"), true);
  assert.equal(matchesTab(unread, "unread"), true);
  assert.equal(matchesTab(read, "unread"), false);
  assert.equal(matchesTab(read, "read"), true);
  assert.equal(matchesTab(unread, "read"), false);
});

test("highestId ignores rows without a numeric id", () => {
  assert.equal(highestId([notification(3), notification(9), notification(4)]), 9);
  assert.equal(highestId([{ id: "abc" }]), undefined);
  assert.equal(highestId([]), undefined);
});

test("mergeNotificationItems inserts new items newest first", () => {
  const existing = [notification(10), notification(9)];
  const merged = mergeNotificationItems(existing, [notification(12), notification(11)], "all");

  assert.deepEqual(
    merged.map((item) => item.id),
    ["12", "11", "10", "9"],
  );
});

test("mergeNotificationItems keeps the server read state of known items", () => {
  const existing = [notification(10, { read: false })];
  const merged = mergeNotificationItems(
    existing,
    [notification(10, { read: true, readAt: ISO })],
    "all",
  );

  assert.equal(merged.length, 1);
  assert.equal(merged[0].read, true);
  assert.equal(merged[0].readAt, ISO);
});

test("mergeNotificationItems drops rows that left the unread filter", () => {
  const existing = [notification(10), notification(9)];
  const merged = mergeNotificationItems(
    existing,
    [notification(10, { read: true, readAt: ISO })],
    "unread",
  );

  assert.deepEqual(
    merged.map((item) => item.id),
    ["9"],
  );
});

test("mergeNotificationItems keeps rows that are not part of the delta", () => {
  const existing = [notification(10), notification(9)];
  const merged = mergeNotificationItems(existing, [notification(11)], "all");

  assert.deepEqual(
    merged.map((item) => item.id),
    ["11", "10", "9"],
  );
});

test("the engine polls with the watermark and advances it", async () => {
  const { engine, fetcher, storage, applied } = createEngine();
  fetcher.setResult({
    items: [notification(11), notification(12)],
    hasMore: false,
    unreadCount: 2,
    totalCount: 12,
    etag: 'W/"7:CANDIDATE:12:2:12"',
  });

  engine.start();
  await engine.pollNow();

  assert.equal(fetcher.calls.sync[0].sinceId, undefined);
  assert.equal(fetcher.calls.sync[0].audience, "CANDIDATE");
  assert.equal(applied.items.length, 2);
  assert.deepEqual(applied.counts[0], { unreadCount: 2, totalCount: 12 });
  assert.equal(engine.watermark(), 12);
  assert.equal(storage.getItem("gw:notification-sync:7:CANDIDATE"), "12");

  await engine.pollNow();
  assert.equal(fetcher.calls.sync[1].sinceId, 12);
  // The tag of the previous round makes the next request conditional.
  assert.equal(fetcher.calls.sync[1].etag, 'W/"7:CANDIDATE:12:2:12"');
});

test("a conditional answer that matched keeps the rows and the counters", async () => {
  const { engine, fetcher, applied } = createEngine();
  fetcher.setResult({
    items: [],
    unreadCount: null,
    totalCount: null,
    notModified: true,
    etag: 'W/"7:CANDIDATE:12:2:12"',
  });

  engine.start();
  await engine.pollNow();

  assert.equal(applied.items.length, 0);
  assert.equal(applied.counts.length, 0);
  assert.equal(applied.resyncs, 0);
  // The tag is kept, so the next round stays conditional.
  assert.equal(fetcher.calls.sync[0].etag, null);
});

test("the engine restores a persisted watermark", async () => {
  const { engine, fetcher } = createEngine({}, { "gw:notification-sync:7:CANDIDATE": "42" });

  engine.start();
  await engine.pollNow();

  assert.equal(fetcher.calls.sync[0].sinceId, 42);
  assert.equal(engine.watermark(), 42);
});

test("a truncated delta does not advance the watermark and asks for a reload", async () => {
  const { engine, fetcher, applied } = createEngine();
  fetcher.setResult({ items: [notification(20)], hasMore: true, unreadCount: 1, totalCount: 20 });

  engine.start();
  await engine.pollNow();

  assert.equal(engine.watermark(), undefined);
  assert.equal(applied.resyncs, 1);
});

test("the engine backs off after failures and recovers on success", async () => {
  const { engine, clock, fetcher, applied } = createEngine();
  engine.start();

  fetcher.failWith(new Error("network down"));
  await engine.pollNow();
  assert.equal(applied.errors.length, 1);
  assert.equal(clock.lastDelay(), 2_000);

  await engine.pollNow();
  assert.equal(clock.lastDelay(), 4_000);

  await engine.pollNow();
  assert.equal(clock.lastDelay(), 8_000);

  fetcher.failWith(null);
  await engine.pollNow();
  assert.equal(clock.lastDelay(), 1_000);
});

test("the engine does not poll while the tab is hidden", async () => {
  let visible = false;
  const { engine, clock, fetcher } = createEngine({ isVisible: () => visible });
  engine.start();

  await clock.advance(1_000);
  assert.equal(fetcher.calls.sync.length, 0);

  visible = true;
  await clock.advance(1_000);
  assert.equal(fetcher.calls.sync.length, 1);
});

test("the engine applies a result broadcast by another tab", async () => {
  const { engine, channel, applied, fetcher, clock } = createEngine();
  engine.start();

  channel.emit({
    type: "result",
    audience: "CANDIDATE",
    items: [notification(30)],
    counts: { unreadCount: 1, totalCount: 30 },
    at: clock.now(),
  });

  assert.equal(applied.items.length, 1);
  assert.deepEqual(applied.counts[0], { unreadCount: 1, totalCount: 30 });
  assert.equal(engine.watermark(), 30);

  // The fresh remote result suppresses the own poll of this tab.
  await clock.advance(500);
  assert.equal(fetcher.calls.sync.length, 0);

  await clock.advance(1_000);
  assert.equal(fetcher.calls.sync.length, 1);
});

test("the engine broadcasts its own result", async () => {
  const { engine, channel, fetcher } = createEngine();
  fetcher.setResult({
    items: [notification(31)],
    hasMore: false,
    unreadCount: 1,
    totalCount: 31,
    etag: 'W/"7:CANDIDATE:31:1:31"',
  });

  engine.start();
  await engine.pollNow();

  assert.equal(channel.posted.length, 1);
  assert.equal(channel.posted[0].type, "result");
  assert.equal(channel.posted[0].audience, "CANDIDATE");
  assert.equal(channel.posted[0].items[0].id, "31");
  assert.equal(channel.posted[0].etag, 'W/"7:CANDIDATE:31:1:31"');
});

test("reset forgets the watermark", async () => {
  const { engine, fetcher, storage } = createEngine();
  fetcher.setResult({ items: [notification(12)], hasMore: false, unreadCount: 1, totalCount: 12 });

  engine.start();
  await engine.pollNow();
  assert.equal(engine.watermark(), 12);

  engine.reset();
  assert.equal(engine.watermark(), undefined);
  assert.equal(storage.getItem("gw:notification-sync:7:CANDIDATE"), null);

  await engine.pollNow();
  assert.equal(fetcher.calls.sync[1].sinceId, undefined);
});

test("switching the audience uses its own watermark", async () => {
  const { engine, fetcher, storage } = createEngine();
  fetcher.setResult({ items: [notification(12)], hasMore: false, unreadCount: 1, totalCount: 12 });

  engine.start();
  await engine.pollNow();
  assert.equal(engine.watermark(), 12);

  storage.setItem("gw:notification-sync:7:RECRUITER", "77");
  engine.setAudience("RECRUITER");
  await engine.pollNow();

  assert.equal(fetcher.calls.sync[1].sinceId, 77);
  assert.equal(fetcher.calls.sync[1].audience, "RECRUITER");
});
