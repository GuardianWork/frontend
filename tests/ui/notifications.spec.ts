import assert from "node:assert/strict";
import { expect, test, login } from "./fixtures";

/** Deliver a notification to the signed-in recipient of the mock API. */
async function deliverNotification(
  mockApiUrl: string,
  accessToken: string,
  payload: Record<string, unknown>,
) {
  const response = await fetch(`${mockApiUrl}/api/mock/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  expect(response.status).toBe(201);
  return (await response.json()) as { data: { id: string } };
}

async function loginThroughApi(mockApiUrl: string, username: string) {
  const response = await fetch(`${mockApiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail: username, password: "Guardian123!" }),
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as { data: { accessToken: string } };
  return body.data.accessToken;
}

test.describe("notification inbox", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "candidate_demo");
    await page.goto("/can/notifications", { waitUntil: "domcontentloaded" });
  });

  test("lists the inbox with the unread and read counters of the server", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Thông báo", exact: true })).toBeVisible();
    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("7");
    await expect(page.locator("#notif-tab-read .notif-tab__badge")).toHaveText("4");
    await expect(page.locator("#notif-tab-all .notif-tab__badge")).toHaveText("11");
    await expect(
      page.getByText("Nhà tuyển dụng đã xem hồ sơ của bạn", { exact: true }),
    ).toBeVisible();
  });

  test("marks one notification read and lowers the unread counter", async ({ page }) => {
    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("7");

    await page.getByRole("button", { name: /Nhà tuyển dụng đã xem hồ sơ của bạn/ }).click();

    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("6");
    await expect(page.locator("#notif-tab-read .notif-tab__badge")).toHaveText("5");
  });

  test("marks every notification read with one request", async ({ page }) => {
    await page.getByRole("button", { name: "Đánh dấu tất cả là đã đọc" }).click();

    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveCount(0);
    await expect(page.locator("#notif-tab-read .notif-tab__badge")).toHaveText("11");
  });

  test("polls for a delivered notification and shows it without a reload", async ({
    page,
    mockApiUrl,
  }) => {
    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("7");

    const token = await loginThroughApi(mockApiUrl, "candidate_demo");
    await deliverNotification(mockApiUrl, token, {
      title: "Thông báo vừa được gửi",
      body: "Kiểm tra việc thông báo mới xuất hiện mà không cần tải lại trang.",
    });

    await expect(page.getByText("Thông báo vừa được gửi", { exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("8");
    await expect(page.locator("#notif-tab-all .notif-tab__badge")).toHaveText("12");
  });

  test("one poll costs one request and repeats it conditionally", async ({ page }) => {
    const syncRequests: Array<{ search: string; tag: string | undefined }> = [];
    let countRequests = 0;
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/me/notifications/sync") {
        syncRequests.push({ search: url.search, tag: request.headers()["if-none-match"] });
      }
      if (url.pathname === "/api/me/notifications/unread-count") countRequests += 1;
    });

    await page.goto("/can/notifications", { waitUntil: "domcontentloaded" });
    await expect(page.locator("#notif-tab-unread .notif-tab__badge")).toHaveText("7");

    // Two polling rounds are enough to see the watermark and the tag.
    await expect.poll(() => syncRequests.length, { timeout: 20_000 }).toBeGreaterThan(1);

    // The first round has no tag yet, the second one repeats it.
    assert.equal(syncRequests[0].tag, undefined);
    assert.ok(syncRequests[1].tag, "the second round repeats the entity tag");
    // The watermark travels with the request.
    assert.match(syncRequests[1].search, /sinceId=\d+/);
    // The counters come with the round; no extra count request is needed.
    assert.equal(countRequests, 1);
  });
});
