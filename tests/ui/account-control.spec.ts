import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";

async function account(page: Page) {
  await page.goto("/can/account");
  await expect(page.getByRole("textbox", { name: "Tên", exact: true })).toBeVisible();
}
async function registerUnverified(page: Page, api: string) {
  const response = await page.request.post(`${api}/api/auth/register`, {
    data: {
      firstName: "Minh",
      lastName: "Nguyễn",
      username: "unverified_demo",
      email: "unverified@example.test",
      password: "Guardian123!",
    },
  });
  expect(response.ok()).toBe(true);
  await login(page, "unverified_demo");
}
async function requestClosure(page: Page, action: "deactivation" | "deletion") {
  await page
    .locator("#lifecycle")
    .getByRole("button", {
      name: action === "deactivation" ? "Tạm ngừng tài khoản" : "Yêu cầu xóa tài khoản",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[autocomplete="current-password"]').fill("Guardian123!");
  await dialog.getByRole("button", { name: "Gửi mã xác nhận", exact: true }).click();
  await expect(dialog.locator("#closure-code")).toBeVisible();
  return dialog;
}

test("unverified account edits immutable identity and synchronizes with Candidate profile", async ({
  page,
  mockApiUrl,
}) => {
  await registerUnverified(page, mockApiUrl);
  await account(page);
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Email đã đăng ký", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(page.getByRole("button", { name: "Đổi mật khẩu", exact: true })).toHaveCount(0);
  await page.getByRole("textbox", { name: "Họ", exact: true }).fill("  Đặng Thị  ");
  await page.getByRole("textbox", { name: "Tên", exact: true }).fill("Ánh");
  await page.getByLabel("Số điện thoại", { exact: false }).fill("0901234567");
  const put = page.waitForRequest(
    (r) => r.url().endsWith("/api/me/account") && r.method() === "PUT",
  );
  await page.getByRole("button", { name: "Lưu thông tin", exact: true }).click();
  expect((await put).postDataJSON()).toEqual({
    firstName: "Ánh",
    lastName: "Đặng Thị",
    phoneNumber: "0901234567",
  });
  await expect(page.getByRole("status")).toContainText("Đã lưu");
  await page.goto("/can/profile");
  await expect(page.getByRole("heading", { name: "Ánh Đặng Thị", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Chỉnh sửa thông tin cá nhân", exact: true }).click();
  await page.getByRole("textbox", { name: "Tên", exact: true }).fill("Minh");
  await page.getByLabel("Số điện thoại", { exact: true }).fill("");
  const profilePut = page.waitForRequest(
    (r) => r.url().endsWith("/api/v1/candidates/profile") && r.method() === "PUT",
  );
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  const payload = (await profilePut).postDataJSON();
  expect(payload).not.toHaveProperty("fullName");
  expect(payload).toMatchObject({
    firstName: "Minh",
    lastName: "Đặng Thị",
    phoneNumber: null,
  });
  expect(payload).toHaveProperty("skills");
  expect(payload).toHaveProperty("isPublic");
  expect(payload).toHaveProperty("avatarUrl");
  expect(payload).toHaveProperty("educationSummary");
  expect(payload).toHaveProperty("experienceSummary");
  await expect(page.getByRole("dialog")).toContainText("Đã lưu thay đổi");
  await account(page);
  await expect(page.getByRole("textbox", { name: "Tên", exact: true })).toHaveValue("Minh");
  await expect(page.getByLabel("Số điện thoại", { exact: false })).toHaveValue("");
});

test("fixed-email verification preserves zeroes, honors cooldown and refreshes account and auth identity", async ({
  page,
  mockApiUrl,
}) => {
  await registerUnverified(page, mockApiUrl);
  await account(page);
  let requestCount = 0;
  await page.route("**/api/me/email-verification/request", (route) => {
    requestCount++;
    expect(route.request().postData()).toBe(null);
    return route.fulfill({
      json: {
        status: 200,
        message: "Accepted",
        data: {
          deliveryAccepted: true,
          alreadyVerified: false,
          nextRequestAt: new Date(Date.now() + 60000).toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
      },
    });
  });
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(page.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
  await page.getByLabel("Mã xác minh 6 chữ số").fill("012345");
  const confirmation = page.waitForRequest("**/api/me/email-verification/confirm");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  expect((await confirmation).postDataJSON()).toEqual({ emailSecret: "012345" });
  await expect(page.getByRole("button", { name: "Đổi mật khẩu", exact: true })).toBeVisible();
  await expect(page.locator(".account-state--verified")).toContainText("đã được xác minh");
  expect(requestCount).toBe(1);
});

for (const action of ["deactivation", "deletion"] as const) {
  test(`${action} requires action code and acknowledgement, clears tokens and offers unauthenticated recovery`, async ({
    page,
  }) => {
    await login(page, "candidate_demo");
    await account(page);
    const dialog = await requestClosure(page, action);
    const confirm = dialog.getByRole("button", {
      name: action === "deactivation" ? "Tạm ngừng tài khoản" : "Yêu cầu xóa tài khoản",
      exact: true,
    });
    await dialog.getByLabel("Mã xác nhận 6 chữ số").fill("999999");
    await expect(confirm).toBeDisabled();
    await dialog.getByRole("checkbox").check();
    await confirm.click();
    await expect(dialog.getByRole("alert")).toContainText("Mã");
    await dialog.getByLabel("Mã xác nhận 6 chữ số").fill("012345");
    await confirm.click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("status")).toContainText(
      action === "deactivation" ? "tạm ngừng" : "đang chờ xử lý",
    );
    expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBe(
      null,
    );
    await page.getByRole("link", { name: "Kích hoạt lại hoặc hủy yêu cầu xóa tài khoản" }).click();
    await page
      .getByLabel("Bạn muốn thực hiện thao tác nào?")
      .selectOption(action === "deactivation" ? "REACTIVATE" : "CANCEL_DELETION");
    await page.getByLabel("Email hoặc tên đăng nhập", { exact: true }).fill("candidate_demo");
    await page.locator('input[autocomplete="current-password"]').fill("Guardian123!");
    const recoveryRequest = page.waitForRequest("**/api/auth/account-recovery/request-code");
    await page.getByRole("button", { name: "Gửi mã khôi phục", exact: true }).click();
    expect((await recoveryRequest).headers()).not.toHaveProperty("authorization");
    await page.getByLabel("Mã xác nhận 6 chữ số").fill("012345");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", {
        name: action === "deactivation" ? "Kích hoạt lại tài khoản" : "Hủy yêu cầu xóa tài khoản",
        exact: true,
      })
      .click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("status")).toContainText("đăng nhập bình thường");
    expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBe(
      null,
    );
  });
}

test("password change clears both tokens and requires sign-in without refresh", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await account(page);
  let refreshes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/auth/refresh")) refreshes++;
  });
  await page.locator('input[autocomplete="current-password"]').fill("Guardian123!");
  await page.locator("#account-new-password").fill("ChangedPassword123!");
  await page.locator("#account-repeat-password").fill("ChangedPassword123!");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText("Đã đổi mật khẩu");
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBe(null);
  expect(refreshes).toBe(0);
});

for (const role of ["OWNER", "ADMIN", "RECRUITER"]) {
  test(`membership blocker handles ${role} without unusable leave actions`, async ({
    page,
    mockApiUrl,
  }) => {
    await login(page, "candidate_demo");
    await page.route("**/api/auth/me", async (route) => {
      const response = await route.fetch({
        url: `${mockApiUrl}${new URL(route.request().url()).pathname}`,
      });
      const body = await response.json();
      body.data.activeMembership = {
        companyId: 101,
        companyName: "Công ty mẫu",
        companyRole: role,
        joinedAt: "2026-10-01T00:00:00Z",
      };
      await route.fulfill({ json: body });
    });
    await page.route("**/api/me/account", async (route) => {
      const response = await route.fetch({
        url: `${mockApiUrl}${new URL(route.request().url()).pathname}`,
      });
      const body = await response.json();
      body.data.closureEligible = false;
      body.data.closureBlockers = [
        role === "OWNER" ? "COMPANY_OWNERSHIP_EXISTS" : "ACTIVE_COMPANY_MEMBERSHIP_EXISTS",
      ];
      await route.fulfill({ json: body });
    });
    await account(page);
    await expect(
      page.locator("#lifecycle").getByRole("button", { name: "Tạm ngừng tài khoản", exact: true }),
    ).toBeDisabled();
    await expect(
      page.locator("#lifecycle").getByRole("button", { name: "Rời công ty", exact: true }),
    ).toHaveCount(role === "RECRUITER" ? 1 : 0);
    await expect(page.locator(".account-blockers")).toContainText(
      role === "OWNER"
        ? "chuyển quyền sở hữu"
        : role === "ADMIN"
          ? "chưa có quy trình"
          : "rời công ty",
    );
  });
}

test("closure delivery rejection, Retry-After, expired proof and changed eligibility never show lifecycle success", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await account(page);
  let call = 0;
  await page.route("**/api/me/account/deletion/request-code", (route) => {
    call++;
    return route.fulfill(
      call === 1
        ? {
            status: 429,
            headers: { "Retry-After": "1" },
            json: { status: 429, message: "42994 COOLDOWN" },
          }
        : call === 2
          ? {
              json: {
                status: 200,
                data: {
                  deliveryAccepted: false,
                  nextRequestAt: new Date(Date.now() + 1000).toISOString(),
                },
              },
            }
          : {
              json: {
                status: 200,
                data: {
                  deliveryAccepted: true,
                  nextRequestAt: new Date(Date.now() + 60000).toISOString(),
                  expiresAt: new Date(Date.now() - 1000).toISOString(),
                },
              },
            },
    );
  });
  await page
    .locator("#lifecycle")
    .getByRole("button", { name: "Yêu cầu xóa tài khoản", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.locator('input[autocomplete="current-password"]').fill("Guardian123!");
  await dialog.getByRole("button", { name: "Gửi mã xác nhận", exact: true }).click();
  await expect(dialog.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
  await dialog.getByRole("button", { name: "Gửi mã xác nhận", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("chưa được chấp nhận");
  await expect(dialog.locator("#closure-code")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Gửi lại mã cho thao tác này", exact: true }).click();
  await expect(dialog.locator("#closure-code")).toBeDisabled();
  await expect(dialog.getByRole("status").filter({ hasText: "hết hạn" })).toBeVisible();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).not.toBe(
    null,
  );
});

test("recovery uses no stale Bearer, does not infer bans from sign-in, and respects bans", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await page.route("**/api/auth/account-recovery/request-code", (route) => {
    expect(route.request().headers()).not.toHaveProperty("authorization");
    return route.fulfill({
      status: 403,
      json: { status: 403, message: "40304 ACCOUNT_SUSPENDED" },
    });
  });
  await page.goto("/account-recovery");
  await page.getByLabel("Email hoặc tên đăng nhập", { exact: true }).fill("candidate_demo");
  await page.locator('input[autocomplete="current-password"]').fill("Guardian123!");
  await page.getByRole("button", { name: "Gửi mã khôi phục", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("bị cấm");
  await expect(page.locator("#recovery-code")).toHaveCount(0);
});

test("protected account 401 ends session without refresh; Staff never sees self-service", async ({
  page,
  mockApiUrl,
}) => {
  await login(page, "candidate_demo");
  let refreshes = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/auth/refresh")) refreshes++;
  });
  await page.route("**/api/me/account", (route) =>
    route.fulfill({ status: 401, json: { status: 401, message: "40101 INVALID_SESSION" } }),
  );
  await page.goto("/can/account");
  await expect(page).toHaveURL(/\/login/);
  expect(refreshes).toBe(0);
  await page.unroute("**/api/me/account");
  await login(page, "candidate_demo");
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({
      url: `${mockApiUrl}${new URL(route.request().url()).pathname}`,
    });
    const body = await response.json();
    body.data.role = "STAFF";
    await route.fulfill({ json: body });
  });
  await page.goto("/can/account");
  await expect(page.getByRole("alert")).toContainText("không dành cho Staff");
  await expect(page.getByRole("textbox", { name: "Tên", exact: true })).toHaveCount(0);
});

test("account and recovery render at desktop and phone sizes with semantic color and focus", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await account(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator(".workspace-content > main").evaluate((el) => (el.scrollTop = 0));
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    expect(await page.locator("main").evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      false,
    );
    await page.screenshot({ path: `.impeccable/review/gw95-account-${width}.png`, fullPage: true });
    await page
      .locator("#lifecycle")
      .getByRole("button", { name: "Yêu cầu xóa tài khoản", exact: true })
      .click();
    await page.screenshot({
      path: `.impeccable/review/gw95-deletion-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("dialog").getByRole("button", { name: "Hủy", exact: true }).click();
  }
  await page.goto("/account-recovery");
  await expect(page.locator("#recovery-identifier")).toBeEnabled();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({
      path: `.impeccable/review/gw95-recovery-${width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  }
});

test("a Company membership arriving after code delivery blocks confirmation and refreshes eligibility", async ({
  page,
  mockApiUrl,
}) => {
  await login(page, "candidate_demo");
  await account(page);
  const dialog = await requestClosure(page, "deactivation");
  await page.route("**/api/me/account/deactivation/confirm", (route) =>
    route.fulfill({
      status: 409,
      json: { status: 409, message: "40910 ACTIVE_COMPANY_MEMBERSHIP_EXISTS" },
    }),
  );
  await page.route("**/api/me/account", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/me/account` });
    const body = await response.json();
    body.data.closureEligible = false;
    body.data.closureBlockers = ["ACTIVE_COMPANY_MEMBERSHIP_EXISTS"];
    await route.fulfill({ json: body });
  });
  await dialog.getByLabel("Mã xác nhận 6 chữ số").fill("012345");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Tạm ngừng tài khoản", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("thành viên công ty");
  await expect(
    dialog.getByRole("button", { name: "Tạm ngừng tài khoản", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(page.locator(".account-blockers")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).not.toBe(
    null,
  );
});
