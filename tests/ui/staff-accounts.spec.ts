import { test, expect, login } from "./fixtures";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
const user = {
  id: 25,
  username: "nguyen.an",
  firstName: "An",
  lastName: "Nguyễn",
  email: "an@example.test",
  role: "USER",
  emailVerified: true,
  status: "ACTIVE",
  createdAt: "2026-10-01T02:00:00Z",
  updatedAt: "2026-10-02T02:00:00Z",
  activeBan: null,
  canBan: true,
  canUnban: false,
};
test("account enforcement preserves values, reconciles uncertain results and renders responsive views", async ({
  page,
}) => {
  let current = { ...user };
  let mutations = 0;
  let details = 0;
  await page.route("**/api/staff/accounts/**", async (route) => {
    const request = route.request();
    expect(request.headers().authorization).toMatch(/^Bearer /);
    expect(request.headers()["content-type"]).toBe("application/json");
    const url = new URL(request.url());
    if (request.method() === "POST") {
      mutations++;
      if (mutations === 1)
        return route.fulfill({ status: 503, json: { status: 503, message: "Unavailable" } });
      expect(request.postDataJSON()).toEqual({ reason: "Vi phạm quy định", expiresAt: null });
      current = {
        ...user,
        status: "BANNED",
        canBan: false,
        canUnban: true,
        activeBan: {
          id: 1,
          reason: "Vi phạm quy định",
          startedAt: "2026-10-30T02:00:00Z",
          expiresAt: null,
          createdBy: 1,
        },
      } as typeof user;
      return route.fulfill({ json: { status: 200, data: current } });
    }
    if (/\/25$/.test(url.pathname)) {
      details++;
      return route.fulfill({ json: { status: 200, data: current } });
    }
    expect(url.searchParams.get("size")).toBe("20");
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: [current],
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
  await page.goto(`${origin}/staff/accounts`);
  await expect(page.getByRole("button", { name: "Xem chi tiết" })).toBeVisible();
  await page.screenshot({ path: ".impeccable/review/accounts-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".impeccable/review/accounts-mobile.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await expect(page.getByRole("heading", { name: "nguyen.an", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Khóa tài khoản", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Khóa tài khoản", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Khóa tài khoản", exact: true }).click();
  expect(details).toBeGreaterThanOrEqual(2);
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Lý do").fill("   ");
  await expect(dialog.getByRole("button", { name: "Xác nhận khóa" })).toBeDisabled();
  await dialog.getByLabel("Lý do").fill("  Vi phạm quy định  ");
  await dialog.getByLabel("Thời hạn khóa").selectOption("permanent");
  await dialog.getByRole("button", { name: "Xác nhận khóa" }).click();
  await expect(dialog.getByRole("button", { name: "Xác nhận khóa" })).toBeDisabled();
  await expect(dialog.getByLabel("Lý do")).toHaveValue("  Vi phạm quy định  ");
  await dialog.getByRole("button", { name: "Tải lại chi tiết trước khi thử lại" }).click();
  await dialog.getByRole("button", { name: "Xác nhận khóa" }).click();
  await expect(page.getByText("Đã khóa tài khoản.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mở khóa tài khoản", exact: true })).toBeVisible();
  expect(mutations).toBe(2);
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await expect(page.getByRole("button", { name: "nguyen.an", exact: true })).toBeFocused();
});

test("company temporary ban, conflict refresh and unban use server permissions", async ({
  page,
}) => {
  let company: Record<string, unknown> = {
    id: 52,
    name: "Công ty An Phúc",
    taxCode: "0312345678",
    verificationStatus: "VERIFIED",
    isBanned: false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    activeBan: null,
    canBan: true,
    canUnban: false,
  };
  let conflict = true;
  let posts = 0;
  await page.route("**/api/staff/accounts/**", async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === "POST") {
      posts++;
      const body = route.request().postDataJSON();
      if (url.pathname.endsWith("/ban")) {
        expect(body.expiresAt).toBe(new Date("2099-11-06T09:00").toISOString());
        company = {
          ...company,
          isBanned: true,
          canBan: false,
          canUnban: true,
          activeBan: {
            id: 9,
            reason: body.reason,
            startedAt: user.createdAt,
            expiresAt: body.expiresAt,
            createdBy: 1,
          },
        };
      } else {
        expect(body).toEqual({ reason: "Đã chấp nhận khiếu nại" });
        if (conflict) {
          conflict = false;
          return route.fulfill({ status: 409, json: { status: 409 } });
        }
        company = { ...company, isBanned: false, canBan: true, canUnban: false, activeBan: null };
      }
      return route.fulfill({ json: { status: 200, data: company } });
    }
    if (/\/52$/.test(url.pathname)) return route.fulfill({ json: { status: 200, data: company } });
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: url.pathname.endsWith("/companies") ? [company] : [user],
          pageNumber: Number(url.searchParams.get("page")),
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
  await page.goto(`${origin}/staff/accounts`);
  await page.getByRole("tab", { name: "Công ty", exact: true }).click();
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await page.getByRole("button", { name: "Khóa tài khoản", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Phiên đăng nhập của các thành viên/)).toBeVisible();
  await dialog.getByLabel("Lý do").fill("Vi phạm quy định");
  await dialog.getByLabel("Hết hạn vào").fill("2099-11-06T09:00");
  await dialog.getByRole("button", { name: "Xác nhận khóa" }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Mở khóa tài khoản", exact: true }).click();
  await expect(dialog.getByText(/Tin tuyển dụng của công ty vẫn bị đình chỉ/)).toBeVisible();
  await dialog.getByLabel("Lý do").fill("Đã chấp nhận khiếu nại");
  await dialog.getByRole("button", { name: "Xác nhận mở khóa" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Trạng thái đã thay đổi");
  await expect(dialog.getByRole("button", { name: "Xác nhận mở khóa" })).toBeEnabled();
  await dialog.getByRole("button", { name: "Xác nhận mở khóa" }).click();
  await expect(page.getByText("Đã mở khóa tài khoản.", { exact: true })).toBeVisible();
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Đã mở khóa tài khoản." });
  await expect(toast).toBeVisible();
  await expect(dialog).not.toBeVisible();
  await expect(toast).toHaveAttribute("data-mounted", "true");
  await page.screenshot({
    path: ".impeccable/review/toast-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  const bounds = await toast.boundingBox();
  expect(bounds!.x + bounds!.width).toBeGreaterThan(1300);
  expect(bounds!.y + bounds!.height).toBeGreaterThan(900);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".impeccable/review/toast-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await toast.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(toast).not.toBeVisible();
  expect(posts).toBe(3);
});

test("search is debounced and encoded; pages and tabs reset; stale details close on 404", async ({
  page,
}) => {
  const searches: string[] = [];
  await page.route("**/api/staff/accounts/**", async (route) => {
    const url = new URL(route.request().url());
    if (/\/25$/.test(url.pathname)) return route.fulfill({ status: 404, json: { status: 404 } });
    const q = url.searchParams.get("q") || "";
    searches.push(`${url.pathname}:${q}:${url.searchParams.get("page")}`);
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: q === "missing" ? [] : [user],
          pageNumber: Number(url.searchParams.get("page")),
          pageSize: 20,
          totalElements: q === "missing" ? 0 : 41,
          totalPages: q === "missing" ? 0 : 3,
          first: url.searchParams.get("page") === "0",
          last: false,
        },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/accounts`);
  await page.getByRole("button", { name: "Trang sau" }).click();
  await expect(page.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await page.getByRole("searchbox").fill("An & Nguyễn?");
  await expect.poll(() => searches.at(-1)).toBe("/api/staff/accounts/users:An & Nguyễn?:0");
  await page.getByRole("searchbox").fill("missing");
  await expect(page.getByRole("heading", { name: "Không tìm thấy tài khoản" })).toBeVisible();
  await page.getByRole("tab", { name: "Công ty", exact: true }).click();
  await expect.poll(() => searches.at(-1)).toBe("/api/staff/accounts/companies::0");
  await page.getByRole("tab", { name: "Tài khoản người dùng" }).click();
  await page.getByRole("button", { name: "Xem chi tiết" }).click();
  await expect(
    page.getByText("Tài khoản không còn tồn tại. Vui lòng tìm kiếm lại.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("searchbox")).toBeVisible();
});
