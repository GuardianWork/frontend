import { test, expect, login } from "./fixtures";

test("complete company setup uploads the dossier and document atomically", async ({
  page,
}, info) => {
  await login(page, "recruiter_demo", true);
  await page.locator('[name="companyName"]').fill("Công ty Ánh Dương");
  await page.locator('[name="taxCode"]').fill("0312345678");
  await page.locator('[name="workAddress"]').fill("123 Nguyễn Huệ, TP. Hồ Chí Minh");
  await page.locator('[name="submitterPosition"]').fill("Giám đốc");
  await page.locator('[name="representation"]').selectOption("AUTHORIZED_REPRESENTATIVE");
  await page.locator('[name="file"]').setInputFiles({
    name: "license.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await page.getByRole("checkbox").check();
  await page.screenshot({ path: `/tmp/company-setup-${info.project.name}.png`, fullPage: true });
  const request = page.waitForRequest((request) =>
    request.url().endsWith("/companies/verification-request"),
  );
  await page.getByRole("button", { name: "Đăng ký công ty", exact: true }).click();
  const submitted = await request;
  expect(submitted.headers()["content-type"]).toContain("multipart/form-data; boundary=");
  expect(submitted.postData()).toContain('"representation":"AUTHORIZED_REPRESENTATIVE"');
  expect(submitted.postData()).not.toContain('"email":');
  await expect(
    page.getByText("Đã đăng ký công ty thành công. Công ty đang chờ xác minh."),
  ).toBeVisible();
  await expect(page.locator('[name="companyName"]')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("unverified accounts can sign in and explicitly request email verification", async ({
  page,
  mockApiUrl,
}) => {
  await page.request.post(`${mockApiUrl}/api/auth/register`, {
    data: {
      firstName: "An",
      lastName: "Nguyễn",
      username: "new_user",
      email: "new@example.test",
      password: "Guardian123!",
    },
  });
  await login(page, "new_user", true);
  await expect(page.getByRole("heading", { name: "Xác minh email để tuyển dụng" })).toBeVisible();
  await expect(page.locator('[name="companyName"]')).toBeEnabled();
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(page.getByText("Chưa gửi được mã xác minh.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
});

test("email verification submits a six-digit string and refreshes eligibility after explicit confirmation", async ({
  page,
  mockApiUrl,
}, info) => {
  let verified = false;
  let confirmations = 0;
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    body.data.emailVerified = verified;
    body.data.recruitingEmailEligible = verified;
    await route.fulfill({ json: body });
  });
  await page.route("**/api/me/email-verification/request", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          alreadyVerified: false,
          deliveryAccepted: true,
          nextRequestAt: new Date(Date.now() + 60000).toISOString(),
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        },
      },
    }),
  );
  await page.route("**/api/me/email-verification/confirm", async (route) => {
    confirmations++;
    const code = route.request().postDataJSON().emailSecret;
    expect(typeof code).toBe("string");
    if (code !== "012345") {
      await route.fulfill({
        status: 400,
        json: { status: 400, message: "40030 INVALID_EMAIL_PROOF" },
      });
      return;
    }
    verified = true;
    await route.fulfill({ json: { status: 200, data: { emailVerified: true } } });
  });
  await login(page, "recruiter_demo", true);
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(page.getByRole("button", { name: /Gửi lại sau/ })).toBeDisabled();
  expect(confirmations).toBe(0);
  const code = page.getByRole("textbox", { name: "Mã xác minh 6 chữ số" });
  await code.fill("123456");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mã không hợp lệ");
  await expect(page.locator('[name="companyName"]')).toBeEnabled();
  await code.fill("012345");
  await page.screenshot({ path: `/tmp/email-code-${info.project.name}.png`, fullPage: true });
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain("012345");
  expect(page.url()).not.toContain("012345");
  await page.getByRole("button", { name: "Xác nhận mã", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Mã xác minh 6 chữ số" })).toHaveCount(0);
  await expect(page.locator('[name="companyName"]')).toBeEnabled();
  expect(confirmations).toBe(2);
});

test("code request cooldown honors Retry-After and expired codes require a new request", async ({
  page,
  mockApiUrl,
}) => {
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    body.data.emailVerified = false;
    body.data.recruitingEmailEligible = false;
    await route.fulfill({ json: body });
  });
  await page.route("**/api/me/email-verification/request", (route) =>
    route.fulfill({
      status: 429,
      headers: { "Retry-After": "17" },
      json: { status: 429, message: "42930 EMAIL_REQUEST_COOLDOWN" },
    }),
  );
  await login(page, "recruiter_demo", true);
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(page.getByRole("button", { name: /Gửi lại sau 1[0-7] giây/ })).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText("Vui lòng chờ");
});

test("an expired code disables confirmation until a replacement is requested", async ({
  page,
  mockApiUrl,
}) => {
  await page.route("**/api/auth/me", async (route) => {
    const response = await route.fetch({ url: `${mockApiUrl}/api/auth/me` });
    const body = await response.json();
    body.data.emailVerified = false;
    body.data.recruitingEmailEligible = false;
    await route.fulfill({ json: body });
  });
  let requests = 0;
  await page.route("**/api/me/email-verification/request", (route) => {
    requests++;
    return route.fulfill({
      json: {
        status: 200,
        data: {
          alreadyVerified: false,
          deliveryAccepted: true,
          nextRequestAt: new Date(Date.now() - 1000).toISOString(),
          expiresAt: new Date(Date.now() + (requests === 1 ? -1000 : 600000)).toISOString(),
        },
      },
    });
  });
  await login(page, "recruiter_demo", true);
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  const code = page.getByRole("textbox", { name: "Mã xác minh 6 chữ số" });
  await expect(code).toBeDisabled();
  await expect(page.getByRole("status").filter({ hasText: "Mã đã hết hạn" })).toBeVisible();
  await page.getByRole("button", { name: "Gửi mã xác minh", exact: true }).click();
  await expect(code).toBeEnabled();
  await expect(code).toHaveValue("");
});
