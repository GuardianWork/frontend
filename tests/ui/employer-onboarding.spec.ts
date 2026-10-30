import { test, expect, login } from "./fixtures";

function envelope(data: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify({ status, data }) };
}

test("employer registration creates an account without logging in even when email delivery fails", async ({
  page,
}, info) => {
  let payload: Record<string, unknown> = {};
  await page.route("**/api/employer-registrations", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill(
      envelope(
        { userId: 123, emailVerified: false, stage: "EMAIL_REQUIRED", deliveryAccepted: false },
        201,
      ),
    );
  });
  await page.goto("/register?role=recruiter");
  await page.locator("#register-fullName").fill("Nguyễn An");
  await page.locator("#register-phone").fill("0901234567");
  await page.locator("#register-companyName").fill("Công ty Alpha");
  await page.locator("#register-workAddress").fill("Hà Nội");
  await page.locator("#register-gender").selectOption("OTHER");
  await page.locator("#register-email").fill("an@example.test");
  await page.locator("#register-password").fill("Guardian123!");
  await page.locator("#register-confirmation").fill("Guardian123!");
  await page.screenshot({
    path: `/tmp/employer-register-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đăng ký tuyển dụng", exact: true }).click();
  await expect(page.getByText("Tạo tài khoản thành công!")).toBeVisible();
  await expect(page.getByText(/bạn không cần đăng ký lại/)).toBeVisible();
  expect(Object.keys(payload).sort()).toEqual(
    [
      "fullName",
      "phone",
      "companyName",
      "gender",
      "workAddress",
      "email",
      "password",
      "passwordConfirmation",
    ].sort(),
  );
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
});

test("email stage blocks direct company/jobs/invitation routes and resend preserves account with cooldown", async ({
  page,
}, info) => {
  await page.route("**/api/me/employer-onboarding", (route) =>
    route.fulfill(envelope({ stage: "EMAIL_REQUIRED" })),
  );
  let sent = 0;
  await page.route("**/api/me/employer-onboarding/email/send", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    expect(route.request().postData()).toBeNull();
    sent++;
    await route.fulfill(envelope({ deliveryAccepted: false }));
  });
  await login(page, "recruiter_demo", true);
  for (const path of [
    "/recruiter/jobs?create=true",
    "/recruiter/verification",
    "/recruiter/members",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Xác thực email của bạn" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toHaveCount(
      0,
    );
    await expect(page.locator('input[name="companyName"]')).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Gửi lại email xác thực", exact: true }).click();
  await expect(page.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
  await expect(page.getByText(/Tài khoản vẫn tồn tại/)).toBeVisible();
  expect(sent).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `/tmp/employer-email-${info.project.name}.png`, fullPage: true });
});

test("fragment is removed before login and verified with the current account before reloading onboarding", async ({
  page,
}) => {
  let verified = false;
  await page.route("**/api/me/employer-onboarding", (route) =>
    route.fulfill(envelope({ stage: verified ? "COMPANY_ACTION_REQUIRED" : "EMAIL_REQUIRED" })),
  );
  await page.route("**/api/me/employer-onboarding/email/verify", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    expect(route.request().postDataJSON()).toEqual({ emailSecret: "one-time-test-secret" });
    verified = true;
    await route.fulfill(envelope(null));
  });
  await page.goto("/login?role=recruiter#memberEmailSecret=one-time-test-secret");
  await expect(page).not.toHaveURL(/memberEmailSecret/);
  await expect(page.getByText(/Đăng nhập đúng tài khoản nhận email/)).toBeVisible();
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: "Xác thực email cho tài khoản này" }).click();
  await expect(
    page.getByRole("heading", { name: "Kết nối với công ty của bạn", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Chuẩn bị hồ sơ công ty", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem lời mời công ty", exact: true })).toBeVisible();
  expect(verified).toBe(true);
  const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
  expect(stored).not.toContain("one-time-test-secret");
});

test("server onboarding overrides membership and unknown states never unlock recruitment", async ({
  page,
}) => {
  let stage = "PENDING";
  await page.route("**/api/me/employer-onboarding", (route) => route.fulfill(envelope({ stage })));
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?create=true");
  await expect(page.getByRole("heading", { name: "Hồ sơ công ty đang chờ duyệt" })).toBeVisible();
  stage = "REJECTED";
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  await expect(page.getByRole("heading", { name: "Hồ sơ công ty cần bổ sung" })).toBeVisible();
  stage = "VERIFIED";
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toBeVisible();
  stage = "PHONE_REQUIRED";
  await page.reload();
  await expect(
    page.getByText("Không thể đọc trạng thái tuyển dụng. Vui lòng tải lại."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toHaveCount(0);
});

test("old registration links explain recovery without calling retired APIs", async ({ page }) => {
  await page.goto("/register?role=recruiter&registrationId=old&continuationToken=old-secret");
  await expect(page.getByText(/Liên kết đăng ký cũ đã ngừng sử dụng/)).toBeVisible();
  await expect(page).not.toHaveURL(/continuationToken|registrationId/);
});

test("invitation acceptance requires server preview and confirmation and reloads server membership", async ({
  page,
  mockApiUrl,
}, info) => {
  let accepted = false;
  await page.route("**/api/me/employer-onboarding", (route) =>
    route.fulfill(envelope({ stage: accepted ? "VERIFIED" : "COMPANY_ACTION_REQUIRED" })),
  );
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    if (accepted)
      body.data.activeMembership = {
        companyId: 101,
        companyName: "Công ty được mời",
        companyRole: "RECRUITER",
        joinedAt: new Date().toISOString(),
      };
    await route.fulfill({ json: body });
  });
  await page.route("**/api/companies/101", (route) =>
    route.fulfill(
      envelope({
        id: 101,
        name: "Công ty được mời",
        taxCode: "0101234567",
        verificationStatus: "VERIFIED",
        version: 1,
      }),
    ),
  );
  await page.route("**/api/company-invitations/preview", async (route) => {
    expect(route.request().postDataJSON()).toEqual({ secret: "invitation-test-secret" });
    await route.fulfill(
      envelope({
        invitationId: 12,
        companyId: 101,
        companyName: "Công ty được mời",
        companyRole: "RECRUITER",
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    );
  });
  await page.route("**/api/company-invitations/accept", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      secret: "invitation-test-secret",
      confirm: true,
    });
    accepted = true;
    await route.fulfill(
      envelope({ membershipId: 21, companyRole: "RECRUITER", membershipStatus: "ACTIVE" }, 201),
    );
  });
  await page.goto("/login?role=recruiter#secret=invitation-test-secret");
  await expect(page).not.toHaveURL(/#secret/);
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: "Xem thông tin lời mời" }).click();
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời", exact: true })).toBeDisabled();
  await page.screenshot({
    path: `/tmp/employer-invitation-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Chấp nhận lời mời", exact: true }).click();
  await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toBeVisible();
  expect(accepted).toBe(true);
});

test("candidate phone is normalized and clearing it updates the shared account contact", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await page.goto("/candidate/profile");
  await expect(page.getByText("Chưa cập nhật", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Chỉnh sửa hồ sơ" }).click();
  await page.locator("#candidate-phone").fill("0909876543");
  await page.screenshot({
    path: `/tmp/candidate-contact-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lưu số điện thoại" }).click();
  await expect(page.getByText("+84909876543", { exact: true })).toBeVisible();
  await page.locator("#candidate-phone").fill("");
  await page.getByRole("button", { name: "Lưu số điện thoại" }).click();
  await expect(
    page.getByText("Đã xóa số điện thoại chung của tài khoản.", { exact: true }),
  ).toBeVisible();
  const shared = await page.evaluate(
    async () =>
      (
        await (
          await fetch("/api/me/employer-onboarding", {
            headers: {
              Authorization: `Bearer ${JSON.parse(sessionStorage.getItem("guardianwork_auth_session")!).accessToken}`,
            },
          })
        ).json()
      ).data.phone,
  );
  expect(shared).toBeNull();
});
