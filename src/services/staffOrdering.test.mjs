import assert from "node:assert/strict";
import { test } from "node:test";
import { newestStaffPage } from "./staffPaging.ts";
import { sortDate, sortTableRows } from "../lib/table-sort.ts";

test("newest-first pagination includes every record once across a partial last page", async () => {
  const records = Array.from({ length: 44 }, (_, index) => ({ id: index + 1 }));
  const requests = [];
  const load = async (page) => {
    requests.push(page);
    return {
      content: records.slice(page * 20, (page + 1) * 20),
      pageNumber: page,
      pageSize: 20,
      totalElements: 44,
      totalPages: 3,
      first: page === 0,
      last: page === 2,
    };
  };
  const pages = await Promise.all([0, 1, 2].map((page) => newestStaffPage(load, page)));
  assert.deepEqual(
    pages.map((page) => page.content.length),
    [20, 20, 4],
  );
  assert.deepEqual(
    pages.flatMap((page) => page.content.map((item) => item.id)),
    records.map((item) => item.id).reverse(),
  );
  assert.deepEqual(
    pages.map((page) => [page.pageNumber, page.first, page.last]),
    [
      [0, true, false],
      [1, false, false],
      [2, false, true],
    ],
  );
  assert.ok(requests.length <= 9);
});

test("newest-first pagination handles empty, out-of-range, and changing lists safely", async () => {
  const empty = { content: [], pageNumber: 0, pageSize: 20, totalElements: 0, totalPages: 0 };
  assert.deepEqual((await newestStaffPage(async () => empty, 0)).content, []);
  assert.deepEqual((await newestStaffPage(async () => empty, 7)).content, []);
  await assert.rejects(
    newestStaffPage(async () => empty, -1),
    /Trang/,
  );
  await assert.rejects(
    newestStaffPage(
      async (page) => ({ ...empty, totalElements: page ? 22 : 21, totalPages: 2 }),
      0,
    ),
    /Danh sách đã thay đổi/,
  );
});

test("table sorting compares real dates, Vietnamese names and large IDs without mutating records", () => {
  const rows = [
    { id: "9007199254740993", name: "Đào", at: "31/12/2025 18:30" },
    { id: "9007199254740992", name: "An", at: "01/01/2026 08:00" },
    { id: "10", name: "Bình", at: null },
  ];
  const columns = { at: (row) => sortDate(row.at), name: (row) => row.name, id: (row) => row.id };
  assert.deepEqual(
    sortTableRows(rows, { key: "at", direction: "desc" }, columns).map((row) => row.name),
    ["An", "Đào", "Bình"],
  );
  assert.deepEqual(
    sortTableRows(rows, { key: "at", direction: "asc" }, columns).map((row) => row.name),
    ["Đào", "An", "Bình"],
  );
  assert.deepEqual(
    sortTableRows(rows, { key: "name", direction: "asc" }, columns).map((row) => row.name),
    ["An", "Bình", "Đào"],
  );
  assert.deepEqual(
    sortTableRows(rows, { key: "id", direction: "desc" }, columns).map((row) => row.id),
    ["9007199254740993", "9007199254740992", "10"],
  );
  assert.equal(rows[0].name, "Đào");
  assert.equal(sortDate("not-a-date"), null);
  assert.equal(sortDate("31/02/2026"), null);
  assert.deepEqual(
    sortTableRows(
      [
        { id: 7, at: "2026-11-07T08:00:00Z" },
        { id: 9, at: "2026-11-07T08:00:00Z" },
      ],
      { key: "at", direction: "desc" },
      { at: (row) => sortDate(row.at) },
    ).map((row) => row.id),
    [9, 7],
  );
});
