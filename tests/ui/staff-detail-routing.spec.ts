import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

test("job revision URL survives reload, direct navigation and browser history with list context", async ({
  page,
}) => {
  await staffJobApi(page);
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs?status=ALL`);
  const link = page.getByRole("link", { name: "Xem chi tiết Chuyên viên kế toán", exact: true });
  await expect(link).toHaveAttribute("href", /\/staff\/jobs\/91\?status=ALL/);
  await link.click();
  const detailUrl = page.url();
  await expect(page).toHaveURL(/\/staff\/jobs\/91\?status=ALL$/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Chuyên viên kế toán", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/staff\/jobs\?status=ALL$/);
  await expect(link).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "Chuyên viên kế toán", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Từ chối phiên bản", exact: true }).click();
  expect(page.url()).toBe(detailUrl);
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.goto(`${origin}/staff/audit-logs`);
  await page.goto(detailUrl);
  await expect(
    page.getByRole("heading", { name: "Chuyên viên kế toán", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/jobs\?status=ALL$/);
});

test("user and company account details have independent refreshable routes", async ({ page }) => {
  const user = {
    id: 25,
    username: "routing.user",
    email: "route@example.test",
    role: "USER",
    status: "ACTIVE",
    createdAt: null,
    updatedAt: null,
    activeBan: null,
    canBan: true,
    canUnban: false,
  };
  const company = {
    ...user,
    id: 12,
    name: "Routing Company",
    taxCode: "1234567890",
    isBanned: false,
  };
  await page.route("**/api/staff/accounts/**", (route) => {
    const url = new URL(route.request().url());
    const item = url.pathname.includes("/companies") ? company : user;
    const detail = /\/(25|12)$/.test(url.pathname);
    return route.fulfill({
      json: {
        data: detail
          ? item
          : {
              content: [item],
              pageNumber: 0,
              pageSize: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
            },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/accounts?q=routing`);
  await page.getByRole("link", { name: "Xem chi tiết", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/accounts\/users\/25\?q=routing$/);
  await page.reload();
  await expect(page.getByRole("heading", { name: "routing.user", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("searchbox")).toHaveValue("routing");
  await page.getByRole("tab", { name: "Công ty", exact: true }).click();
  await page.getByRole("link", { name: "Xem chi tiết", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/accounts\/companies\/12\?type=companies$/);
  const url = page.url();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Routing Company", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Khóa tài khoản", exact: true }).click();
  expect(page.url()).toBe(url);
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Công ty", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("verification detail can be opened directly and remains addressable after its queue status changes", async ({
  page,
}) => {
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/verifications`);
  await page.getByRole("link", { name: /Mở hồ sơ/ }).click();
  await expect(page).toHaveURL(/\/staff\/verifications\/101/);
  const url = page.url();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Công ty TNHH Giải Pháp Alpha", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Phê duyệt", exact: true }).click();
  expect(page.url()).toBe(url);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận phê duyệt", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Công ty TNHH Giải Pháp Alpha", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".staff-verification-detail .admin-page-heading")).toContainText(
    "Đã xác minh",
  );
  await page.goto(`${origin}/staff/audit-logs`);
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: "Công ty TNHH Giải Pháp Alpha", exact: true }),
  ).toBeVisible();
});

test("report quick views stay modal and keep the list URL", async ({ page }) => {
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/reports`);
  const url = page.url();
  await page
    .getByRole("button", { name: /Xem chi tiết/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(page.url()).toBe(url);
  await page.reload();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("main table")).toBeVisible();
});

test("missing records retain their concrete URL and show a recoverable detail error", async ({
  page,
}) => {
  await page.route("**/api/staff/accounts/users/999", (route) =>
    route.fulfill({ status: 404, json: { message: "Not found" } }),
  );
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/accounts/users/999`);
  await expect(page.getByRole("alert")).toContainText("không còn tồn tại");
  await expect(page).toHaveURL(/\/staff\/accounts\/users\/999$/);
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/accounts$/);
});

test("opening a concrete staff URL before sign-in returns to that detail after login", async ({
  page,
}) => {
  await staffJobApi(page);
  await page.goto(`${origin}/staff/jobs/91?status=ALL`);
  await expect(page).toHaveURL(/\/login\?next=/);
  await page.locator("#login-identifier").fill("admin_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/jobs\/91\?status=ALL$/);
  await expect(
    page.getByRole("heading", { name: "Chuyên viên kế toán", exact: true }),
  ).toBeVisible();
});

test("staff login ignores return paths outside the staff portal", async ({ page }) => {
  await page.goto(`${origin}/login?next=${encodeURIComponent("/staff/../rec/jobs")}`);
  await page.locator("#login-identifier").fill("admin_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/?$/);
});
