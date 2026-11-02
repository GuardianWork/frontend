import { test, expect, login } from "./fixtures";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
const envelope = (data: unknown) => ({
  status: 200,
  message: "Activity history retrieved successfully",
  data,
});
const pageData = (
  content: unknown[],
  pageNumber = 0,
  totalElements = content.length,
  totalPages = 1,
) => ({
  content,
  pageNumber,
  pageSize: 20,
  totalElements,
  totalPages,
  first: pageNumber === 0,
  last: pageNumber >= totalPages - 1,
});

test("personal activity history filters API data and handles empty, validation, and retry", async ({
  page,
}) => {
  const requests: URL[] = [];
  let fail = false;
  await page.route("**/api/staff/me/activities?**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    if (fail)
      return route.fulfill({
        status: 503,
        json: { status: 503, message: "Unavailable", data: null },
      });
    const content = url.searchParams.get("category")
      ? [
          {
            id: 501,
            occurredAt: "2026-10-15T00:00:00Z",
            category: "ACCOUNT_MANAGEMENT",
            action: "BAN_ACCOUNT",
            targetType: "USER",
            targetId: "9007199254740993",
            revisionId: null,
            changes: [{ field: "status", before: null, after: "BANNED" }],
            reason: "Lý do <script>",
          },
        ]
      : [];
    return route.fulfill({ status: 200, json: envelope(pageData(content)) });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/audit-logs`);
  await expect(page.getByRole("heading", { name: "Lịch sử hoạt động của tôi" })).toBeVisible();
  await expect(page.getByText("Không có hoạt động phù hợp")).toBeVisible();
  expect(requests[0].searchParams.get("fromDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(requests[0].searchParams.get("toDate")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const filterBounds = () =>
    page.locator(".audit-filters input, .audit-filters select").evaluateAll((controls) =>
      controls.map((control) => {
        const { x, y, width, height } = control.getBoundingClientRect();
        return [x, y, width, height].map(Math.round);
      }),
    );
  const originalBounds = await filterBounds();
  await page.getByLabel("Nhóm hoạt động").selectOption("ACCOUNT_MANAGEMENT");
  await page.getByLabel("Hành động").selectOption("BAN_ACCOUNT");
  await page.getByLabel("Loại đối tượng").selectOption("USER");
  await page.getByLabel("Mã đối tượng").fill("9007199254740993");
  expect(await filterBounds()).toEqual(originalBounds);
  await expect(page.locator(".activity-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".activity-table")).toContainText("9007199254740993");
  await expect(page.locator(".activity-table")).toContainText("Không có dữ liệu");
  await expect(page.locator(".activity-table")).toContainText("Lý do <script>");
  expect(requests.at(-1)?.searchParams.getAll("targetId")).toEqual(["9007199254740993"]);
  await page.screenshot({ path: "/tmp/gw-uc22-staff-history-desktop.png", fullPage: true });
  const previousCount = requests.length;
  await page.getByLabel("Mã đối tượng").fill("0");
  await expect(page.getByRole("alert")).toContainText("Mã đối tượng phải là số nguyên dương");
  expect(requests.length).toBe(previousCount);
  fail = true;
  await page.getByLabel("Mã đối tượng").fill("12");
  await expect(page.getByRole("alert")).toContainText("Dịch vụ lịch sử tạm thời gián đoạn");
  await expect(page.getByText("Không có hoạt động phù hợp")).not.toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.locator(".activity-table tbody tr")).toHaveCount(1);
});
