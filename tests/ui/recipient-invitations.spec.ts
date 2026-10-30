import { test, expect } from "./fixtures";

test("invitation email opens a recipient page and removes its secret from the URL", async ({
  page,
}) => {
  await page.goto("/company-invitations#secret=private-invitation");
  await expect(
    page.getByRole("heading", { name: "Lời mời tham gia công ty", exact: true }),
  ).toBeVisible();
  await expect(page).not.toHaveURL(/private-invitation/);
  await expect(page.getByRole("link", { name: "Đăng nhập", exact: true }).first()).toBeVisible();
});

test("invitation survives login and accepts only after preview and explicit confirmation", async ({
  page,
  mockApiUrl,
}, info) => {
  let accepted = false;
  let acceptCalls = 0;
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    if (accepted)
      body.data.activeMembership = {
        companyId: 111,
        companyName: "Công ty Ánh Dương",
        companyRole: "RECRUITER",
        joinedAt: new Date().toISOString(),
      };
    await route.fulfill({ json: body });
  });
  await page.route("**/api/company-invitations/*", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    if (route.request().url().endsWith("/preview")) {
      expect(route.request().postDataJSON()).toEqual({ secret: "private-invitation" });
      await route.fulfill({
        json: {
          status: 200,
          data: {
            invitationId: 22,
            companyId: 111,
            companyName: "Công ty Ánh Dương",
            companyRole: "RECRUITER",
            expiresAt: "2027-01-01T00:00:00Z",
          },
        },
      });
    } else {
      expect(route.request().url()).toMatch(/\/api\/company-invitations\/accept$/);
      expect(route.request().postDataJSON()).toEqual({
        secret: "private-invitation",
        confirm: true,
      });
      accepted = true;
      acceptCalls++;
      await route.fulfill({
        status: 201,
        json: {
          status: 201,
          data: {
            invitationId: 22,
            membershipId: 33,
            companyId: 111,
            companyName: "Công ty Ánh Dương",
            companyRole: "RECRUITER",
            membershipStatus: "ACTIVE",
            acceptedAt: new Date().toISOString(),
          },
        },
      });
    }
  });
  await page.goto("/company-invitations#secret=private-invitation");
  await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/company-invitations$/);
  await page.getByRole("button", { name: "Kiểm tra lời mời", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Công ty Ánh Dương" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời" })).toBeDisabled();
  expect(acceptCalls).toBe(0);
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: `/tmp/invitation-${info.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Chấp nhận lời mời" }).click();
  await expect(page.getByRole("status")).toHaveText("Đã tham gia công ty.");
  expect(acceptCalls).toBe(1);
  expect(
    await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage })),
  ).not.toContain("private-invitation");
});

test("recipient can check consent before email proof and refresh proof without losing the invitation", async ({
  page,
  mockApiUrl,
}) => {
  let verified = false;
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    body.data.emailVerified = verified;
    body.data.recruitingEmailEligible = verified;
    await route.fulfill({ json: body });
  });
  await page.route("**/api/company-invitations/preview", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          invitationId: 22,
          companyId: 111,
          companyName: "Công ty Ánh Dương",
          companyRole: "RECRUITER",
          expiresAt: "2027-01-01T00:00:00Z",
        },
      },
    }),
  );
  let attempts = 0;
  await page.route("**/api/company-invitations/accept", (route) => {
    attempts++;
    expect(route.request().postDataJSON()).toEqual({ secret: "private-invitation", confirm: true });
    return route.fulfill(
      verified
        ? {
            status: 201,
            json: {
              status: 201,
              data: {
                invitationId: 22,
                membershipId: 33,
                companyId: 111,
                companyName: "Công ty Ánh Dương",
                companyRole: "RECRUITER",
                membershipStatus: "ACTIVE",
                acceptedAt: new Date().toISOString(),
              },
            },
          }
        : {
            status: 403,
            json: { status: 403, message: "40335 EMAIL_VERIFICATION_REQUIRED", data: null },
          },
    );
  });
  await page.goto("/company-invitations#secret=private-invitation");
  await page.getByRole("link", { name: "Đăng nhập", exact: true }).click();
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra lời mời", exact: true }).click();
  const consent = page.getByRole("checkbox", { name: "Tôi xác nhận muốn tham gia công ty này." });
  await expect(consent).toBeEnabled();
  await page.getByText("Tôi xác nhận muốn tham gia công ty này.", { exact: true }).click();
  await expect(consent).toBeChecked();
  const accept = page.getByRole("button", { name: "Chấp nhận lời mời" });
  await expect(accept).toBeEnabled();
  await accept.click();
  await expect(page.getByRole("alert")).toContainText("Xác minh email");
  expect(attempts).toBe(1);
  await expect(consent).toBeChecked();
  verified = true;
  await page.getByRole("button", { name: "Cập nhật trạng thái xác minh" }).click();
  await expect(page.getByRole("heading", { name: "Xác minh email để tuyển dụng" })).toHaveCount(0);
  await expect(consent).toBeChecked();
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời" })).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Công ty Ánh Dương" })).toBeVisible();
  await accept.click();
  await expect(page.getByRole("status")).toHaveText("Đã tham gia công ty.");
  expect(attempts).toBe(2);
});
