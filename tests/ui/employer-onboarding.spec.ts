import { test, expect, login } from "./fixtures";

function envelope(data: unknown, status = 200) {
  return { status, contentType: "application/json", body: JSON.stringify({ status, data }) };
}

test("recruiter registration uses shared account registration before Company setup", async ({
  page,
}, info) => {
  let payload: Record<string, unknown> = {};
  await page.route("**/api/auth/register", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill(
      envelope(
        {
          id: 20,
          firstName: "An",
          lastName: "Nguyễn",
          username: "nguyen_an",
          email: "an@example.test",
          role: "USER",
        },
        201,
      ),
    );
  });
  await page.goto("/register?role=recruiter");
  await expect(page.getByText(/thiết lập hồ sơ công ty/)).toBeVisible();
  await page.locator("#register-last-name").fill("Nguyễn");
  await page.locator("#register-first-name").fill("An");
  await page.locator("#register-username").fill("nguyen_an");
  await page.locator("#register-email").fill("an@example.test");
  await page.locator("#register-password").fill("Guardian123!");
  await page.locator("#register-confirmation").fill("Guardian123!");
  await page.screenshot({
    path: `/tmp/employer-register-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Đăng ký tuyển dụng", exact: true }).click();
  await expect(page.getByText("Tạo tài khoản thành công!")).toBeVisible();
  await expect(page.getByText(/thiết lập hồ sơ công ty hoặc chấp nhận lời mời/)).toBeVisible();
  expect(payload).toEqual({
    firstName: "An",
    lastName: "Nguyễn",
    username: "nguyen_an",
    email: "an@example.test",
    password: "Guardian123!",
  });
  expect(await page.evaluate(() => sessionStorage.getItem("guardianwork_auth_session"))).toBeNull();
});

test("a shared account without membership can open Company setup and never calls retired onboarding", async ({
  page,
}) => {
  const retiredRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/me/employer-onboarding")) retiredRequests.push(request.url());
  });
  await login(page, "recruiter_demo", true);
  await page.goto("/recruiter/verification", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Đăng ký công ty", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tên công ty" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem lời mời công ty" })).toBeVisible();
  await page.goto("/recruiter/jobs?create=true", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Kết nối với công ty của bạn" })).toBeVisible();
  expect(retiredRequests).toEqual([]);
});

test("Company verification status alone gates recruiter features", async ({ page }) => {
  let status = "PENDING";
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill(
      envelope({
        id: 101,
        name: "Công ty TNHH Giải Pháp Alpha",
        taxCode: "0101234567",
        verificationStatus: status,
        version: 0,
      }),
    ),
  );
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?create=true");
  await expect(page.getByRole("heading", { name: "Hồ sơ công ty đang chờ duyệt" })).toBeVisible();
  status = "REJECTED";
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  await expect(page.getByRole("heading", { name: "Hồ sơ công ty cần bổ sung" })).toBeVisible();
  status = "VERIFIED";
  await page.getByRole("button", { name: "Tải lại trạng thái" }).click();
  await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toBeVisible();
});

test("old registration links explain recovery without calling retired APIs", async ({ page }) => {
  await page.goto("/register?role=recruiter&registrationId=old&continuationToken=old-secret");
  await expect(page.getByText(/Liên kết đăng ký cũ đã ngừng sử dụng/)).toBeVisible();
  await expect(page).not.toHaveURL(/continuationToken|registrationId/);
});

test("legacy recruiter setup fragments are removed and continue through Company setup", async ({
  page,
}) => {
  await page.goto("/login?role=recruiter#memberEmailSecret=legacy-secret", {
    waitUntil: "domcontentloaded",
  });
  await expect(page).not.toHaveURL(/memberEmailSecret/);
  await expect(
    page.getByText(/Liên kết thiết lập tuyển dụng cũ không còn được dùng/),
  ).toBeVisible();
  await page.locator("#login-identifier").fill("recruiter_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Đăng ký công ty", exact: true })).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify({ ...sessionStorage, ...localStorage }));
  expect(stored).not.toContain("legacy-secret");
});

test("invitation acceptance confirms through the Company API and reloads membership", async ({
  page,
}, info) => {
  let accepted = false;
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      json: {
        status: 200,
        data: {
          id: 2,
          firstName: "Linh",
          lastName: "Trần",
          username: "recruiter_demo",
          email: "recruiter@example.test",
          role: "USER",
          emailVerified: true,
          recruitingEmailEligible: true,
          activeMembership: accepted
            ? {
                companyId: 101,
                companyName: "Công ty được mời",
                companyRole: "RECRUITER",
                joinedAt: new Date().toISOString(),
              }
            : null,
        },
      },
    });
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
  await page.goto("/login?role=recruiter#secret=invitation-test-secret", {
    waitUntil: "domcontentloaded",
  });
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

test("candidate phone is read from the shared profile API and can be cleared", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await page.goto("/candidate/profile");
  await expect(page.getByText("Chưa cập nhật", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Chỉnh sửa số điện thoại", exact: true }).click();
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
  const phone = await page.evaluate(
    async () =>
      (
        await (
          await fetch("/api/candidates/profile", {
            headers: {
              Authorization: `Bearer ${JSON.parse(sessionStorage.getItem("guardianwork_auth_session")!).accessToken}`,
            },
          })
        ).json()
      ).data.phoneNumber,
  );
  expect(phone).toBeNull();
});
