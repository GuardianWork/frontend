import { test, expect } from "./fixtures";

const staffOrigin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
const publicOrigin = process.env.UI_BASE_URL || "http://localhost:5137";
async function enterCredentials(
  page: import("@playwright/test").Page,
  username: string,
  password = "Guardian123!",
) {
  await page.locator("#login-identifier").fill(username);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

test("staff entry has only login and redirects registration to that entry", async ({
  page,
}, info) => {
  await page.goto(staffOrigin);
  await expect(page).toHaveURL(`${staffOrigin}/login`);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập Platform staff", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#login-identifier")).toBeEnabled();
  await expect(page.getByRole("link", { name: /Đăng ký/ })).toHaveCount(0);
  await expect(page.getByRole("radio")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("staff-login.png"), animations: "disabled" });
  await page.goto(`${staffOrigin}/register`);
  await expect(page).toHaveURL(`${staffOrigin}/login`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});

test("wrong credentials retain entered values and allow retry", async ({ page }) => {
  await page.goto(`${staffOrigin}/login`);
  await enterCredentials(page, "admin_demo", "wrong-password");
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator("#login-identifier")).toHaveValue("admin_demo");
  await expect(page.locator("#login-password")).toHaveValue("wrong-password");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
});

test("non-staff accounts are rejected and their temporary session is cleared", async ({ page }) => {
  await page.goto(`${staffOrigin}/login`);
  await enterCredentials(page, "candidate_demo");
  await expect(page.getByRole("alert")).toContainText("không có quyền truy cập Platform staff");
  await expect(page).toHaveURL(`${staffOrigin}/login`);
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
  await expect(
    page.getByRole("heading", { name: "Tổng quan Platform staff", exact: true }),
  ).toHaveCount(0);
});

test("staff login restores identity on reload and logout protects private pages", async ({
  page,
}) => {
  await page.goto(`${staffOrigin}/staff/jobs`);
  await expect(page).toHaveURL(`${staffOrigin}/login`);
  await enterCredentials(page, "admin_demo");
  await expect(
    page.getByRole("heading", { name: "Tổng quan Platform staff", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem("guardianwork_auth_session") || "null")?.user?.role,
    ),
  ).toBe("STAFF");
  await page.reload();
  await expect(page.getByRole("region", { name: "Thông tin staff đang đăng nhập" })).toContainText(
    "admin@example.test",
  );
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(page).toHaveURL(`${staffOrigin}/login`);
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
  await page.goto(`${staffOrigin}/staff/jobs`);
  await expect(page).toHaveURL(`${staffOrigin}/login`);
});

test("public and staff origins isolate sessions and public staff links redirect across ports", async ({
  page,
}) => {
  await page.goto(`${staffOrigin}/login`);
  await enterCredentials(page, "admin_demo");
  await expect(
    page.getByRole("heading", { name: "Tổng quan Platform staff", exact: true }),
  ).toBeVisible();
  await page.goto(`${publicOrigin}/login`);
  await expect(
    page.getByRole("heading", { name: "Đăng nhập GuardianWork", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng ký ngay", exact: true })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
  await page.goto(`${publicOrigin}/staff/jobs`);
  await expect(page).toHaveURL(`${staffOrigin}/staff/jobs`);
  await expect(
    page.getByRole("heading", { name: "Quản lý tin tuyển dụng", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
});
