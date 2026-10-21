import { test, expect } from "./fixtures";
import type { Page } from "@playwright/test";

async function setup(
  page: Page,
  options: {
    unavailable?: boolean;
    alreadyMember?: boolean;
    uncertain?: boolean;
    newAccount?: boolean;
    receiptStatus?: "LEFT" | "REMOVED";
  } = {},
) {
  const state = {
    accepted: false,
    declined: false,
    emailVerified: false,
    phoneVerified: false,
    emailSent: false,
    accepts: 0,
    failed: false,
    privateDossiers: 0,
    authExpired: false,
  };
  const company = {
    companyId: 42,
    companyName: "Công ty TNHH Đồng Hành",
    companyRole: "RECRUITER",
    joinedAt: "2026-10-20T00:00:00Z",
  };
  const user = {
    id: options.newAccount ? 5 : 2,
    username: options.newAccount ? "invited_new" : "recruiter_demo",
    firstName: "An",
    lastName: "Nguyễn",
    email: options.newAccount ? "invited_new@example.test" : "recruiter@example.test",
    role: "USER",
  };
  await page.route("**/api/auth/me", (route) =>
    state.authExpired
      ? route.fulfill({ status: 401, json: { status: 401, message: "Session expired" } })
      : route.fulfill({
          json: {
            status: 200,
            data: { ...user, activeMembership: state.accepted ? company : null },
          },
        }),
  );
  await page.route("**/api/company-invitations/**", async (route) => {
    const action = new URL(route.request().url()).pathname.split("/").pop();
    const body = route.request().postDataJSON();
    expect(body.secret).toBe("private-invitation");
    expect(route.request().url()).not.toContain(body.secret);
    if (options.unavailable || (action === "preview" && (state.accepted || state.declined))) {
      await route.fulfill({
        status: 404,
        json: { status: 404, message: "40410 INVITATION_UNAVAILABLE" },
      });
      return;
    }
    if (options.alreadyMember && action === "accept") {
      await route.fulfill({
        status: 409,
        json: { status: 409, message: "40910 ACTIVE_COMPANY_MEMBERSHIP_EXISTS" },
      });
      return;
    }
    if (action === "accept") {
      expect(body.confirm).toBe(true);
      state.accepted = !options.receiptStatus;
      state.accepts++;
      if (options.uncertain && !state.failed) {
        state.failed = true;
        await route.abort();
        return;
      }
    }
    if (action === "decline") state.declined = true;
    await route.fulfill({
      json: {
        status: 200,
        data:
          action === "preview"
            ? { ...company, invitationId: 17, expiresAt: "2030-10-27T00:00:00Z" }
            : action === "accept"
              ? {
                  ...company,
                  invitationId: 17,
                  membershipId: 29,
                  membershipStatus: options.receiptStatus || "ACTIVE",
                }
              : { invitationId: 17, status: "DECLINED" },
      },
    });
  });
  await page.route("**/api/me/employer-onboarding**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : null;
    if (path.endsWith("email/send")) state.emailSent = true;
    if (path.endsWith("email/verify")) {
      expect(body.emailSecret).toBe("private-email");
      state.emailVerified = true;
    }
    await route.fulfill({
      json: {
        status: 200,
        data: path.endsWith("employer-onboarding")
          ? {
              emailVerified: state.emailVerified,
              phoneVerified: state.phoneVerified,
              phone: null,
              stage: state.phoneVerified
                ? "VERIFIED"
                : state.emailVerified
                  ? "PHONE_REQUIRED"
                  : "EMAIL_REQUIRED",
              companyRole: "RECRUITER",
            }
          : path.endsWith("email/send")
            ? { deliveryAccepted: true }
            : null,
      },
    });
  });
  await page.route("**/api/companies/me/verification", (route) => {
    state.privateDossiers++;
    return route.fulfill({ status: 403, json: { status: 403, message: "Owner only" } });
  });
  return state;
}
async function loginHere(page: Page, username = "recruiter_demo") {
  await page.locator("#login-identifier").fill(username);
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/company-invitations$/);
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
}
async function openInvitation(page: Page) {
  await page.goto("/company-invitations#secret=private-invitation", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(/company-invitations$/);
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page.locator("#login-identifier")).toBeVisible();
}

test("invited recruiter accepts and verifies email with externally completed phone proof", async ({
  page,
}, info) => {
  const state = await setup(page);
  await openInvitation(page);
  expect(state.accepted).toBe(false);
  await loginHere(page);
  await expect(page.getByRole("heading", { name: "Công ty TNHH Đồng Hành" })).toBeVisible();
  expect(state.accepted).toBe(false);
  await page.screenshot({ path: info.outputPath("invitation.png") });
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page).toHaveURL(/employer-onboarding/);
  await page.getByRole("button", { name: "Tiếp tục xác thực" }).click();
  await expect(page.getByRole("heading", { name: "Xác thực email", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Gửi email xác thực", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("tiếp nhận email");
  await page.goto("/employer-onboarding#memberEmailSecret=private-email", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(/employer-onboarding$/);
  await page.getByRole("button", { name: "Xác nhận email", exact: true }).click();
  await expect(
    page.getByText("Email đã được xác thực. Tài khoản đang chờ", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Vào không gian tuyển dụng" })).toHaveCount(0);
  // Phone proof is supplied by the separate ticket; this branch only refreshes its status.
  state.phoneVerified = true;
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  await expect(page.getByRole("link", { name: "Vào không gian tuyển dụng" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("ready.png") });
  await page.getByRole("link", { name: "Vào không gian tuyển dụng" }).click();
  await expect(page.locator(".recruiter-workspace")).toBeVisible();
  expect(state.privateDossiers).toBe(0);
});

test("invitation survives registration and returns to the explicit preview", async ({ page }) => {
  await setup(page, { newAccount: true });
  await openInvitation(page);
  await page.getByRole("link", { name: "Đăng ký ngay" }).click();
  for (const [id, value] of Object.entries({
    "register-first-name": "An",
    "register-last-name": "Nguyễn",
    "register-username": "invited_new",
    "register-email": "invited_new@example.test",
    "register-password": "Guardian123!",
    "register-confirmation": "Guardian123!",
  }))
    await page.locator(`#${id}`).fill(value);
  await page.getByRole("button", { name: "Đăng ký tuyển dụng", exact: true }).click();
  await page.getByRole("link", { name: "Đến trang đăng nhập" }).click();
  await loginHere(page, "invited_new");
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời", exact: true })).toBeVisible();
});

test("unavailable invitation stays generic and never accepts", async ({ page }) => {
  const state = await setup(page, { unavailable: true });
  await openInvitation(page);
  await loginHere(page);
  await expect(page.getByRole("alert")).toContainText("Lời mời không khả dụng");
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời", exact: true })).toHaveCount(0);
  expect(state.accepts).toBe(0);
});

test("recipient explicitly declines without creating membership", async ({ page }) => {
  const state = await setup(page);
  await openInvitation(page);
  await loginHere(page);
  await page.getByRole("button", { name: "Từ chối", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Đã từ chối lời mời" })).toBeVisible();
  expect(state.accepted).toBe(false);
});

test("active membership conflict explains recovery without leaking another company", async ({
  page,
}) => {
  await setup(page, { alreadyMember: true });
  await openInvitation(page);
  await loginHere(page);
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("kết thúc tư cách thành viên");
  await expect(page).toHaveURL(/\/company-invitations$/);
});

test("uncertain acceptance can resume after reload without previewing a consumed invitation", async ({
  page,
}) => {
  const state = await setup(page, { uncertain: true });
  await openInvitation(page);
  await loginHere(page);
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Tiếp tục", exact: true }).click();
  await expect(page).toHaveURL(/employer-onboarding/);
  expect(state.accepts).toBe(2);
});

test("pending phone proof keeps workspace gated without offering SMS delivery", async ({
  page,
}, info) => {
  const state = await setup(page);
  let phoneRequests = 0;
  page.on("request", (request) => {
    if (/\/employer-onboarding\/phone\//.test(request.url())) phoneRequests++;
  });
  await openInvitation(page);
  await loginHere(page);
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page).toHaveURL(/employer-onboarding/);
  await page.goto("/recruiter/jobs", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/employer-onboarding/);
  state.emailVerified = true;
  await page.getByRole("button", { name: "Tiếp tục xác thực" }).click();
  await expect(
    page.getByText("Email đã được xác thực. Tài khoản đang chờ", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Gửi mã xác thực", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Vào không gian tuyển dụng" })).toHaveCount(0);
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  expect(phoneRequests).toBe(0);
  await page.screenshot({ path: info.outputPath("phone-proof-pending.png") });
});

test("email confirmation survives signing in from a new tab session", async ({ page }) => {
  const state = await setup(page);
  state.accepted = true;
  await page.goto("/employer-onboarding#memberEmailSecret=private-email", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("button", { name: "Xác nhận email", exact: true })).toBeEnabled();
  await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/employer-onboarding$/);
  await page.getByRole("button", { name: "Xác nhận email", exact: true }).click();
  await expect(
    page.getByText("Email đã được xác thực. Tài khoản đang chờ", { exact: false }),
  ).toBeVisible();
  expect(state.emailVerified).toBe(true);
});

test("rejected email delivery never shows a sent confirmation", async ({ page }) => {
  const state = await setup(page);
  state.accepted = true;
  await page.goto("/login?role=recruiter&next=%2Femployer-onboarding", {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/employer-onboarding$/);
  await page.getByRole("button", { name: "Tiếp tục xác thực" }).click();
  await page.route("**/api/me/employer-onboarding/email/send", (route) =>
    route.fulfill({ json: { status: 200, data: { deliveryAccepted: false } } }),
  );
  await page.getByRole("button", { name: "Gửi email xác thực", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("chưa khả dụng");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("historical acceptance never reactivates a removed membership", async ({ page }) => {
  await setup(page, { receiptStatus: "REMOVED" });
  await openInvitation(page);
  await loginHere(page);
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tư cách thành viên đã kết thúc" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Vào không gian tuyển dụng" })).toHaveCount(0);
});

test("expired session keeps the invitation available through reauthentication", async ({
  page,
}) => {
  const state = await setup(page);
  await openInvitation(page);
  await loginHere(page);
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời", exact: true })).toBeVisible();
  state.authExpired = true;
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Phiên đăng nhập đã hết hạn");
  state.authExpired = false;
  await page.getByRole("link", { name: "Đăng nhập bằng tài khoản khác" }).click();
  await loginHere(page);
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời", exact: true })).toBeVisible();
  expect(state.accepted).toBe(false);
});
