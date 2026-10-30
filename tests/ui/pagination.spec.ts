import { test, expect, login } from "./fixtures";

test("every staff record list includes pagination", async ({ page }) => {
  await login(page, "admin_demo");
  for (const route of ["reports", "jobs", "accounts", "verifications"]) {
    await page.goto(`/admin/${route}`, { waitUntil: "domcontentloaded" });
    const pagination = page.getByRole("navigation", { name: /^Phân trang/ });
    await expect(pagination).toBeVisible();
    await expect(
      pagination.getByRole("button", { name: "Trang trước", exact: true }),
    ).toBeDisabled();
    await expect(pagination.getByRole("button", { name: "Trang sau", exact: true })).toBeDisabled();
    expect(await page.locator("main tbody tr").count()).toBeLessThanOrEqual(
      route === "verifications" ? 20 : 10,
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
      false,
    );
  }
});

test("verification pagination shows twenty records then the remainder and resets filters", async ({
  page,
  mockApiUrl,
  request,
}, testInfo) => {
  for (let index = 0; index < 20; index++) {
    const username = `pagination_${index}`;
    const password = "Guardian123!";
    const registered = await request.post(`${mockApiUrl}/api/auth/register`, {
      data: {
        firstName: "Pagination",
        lastName: `Test ${index}`,
        username,
        email: `${username}@example.test`,
        password,
      },
    });
    expect(registered.status()).toBe(201);
    const loggedIn = await request.post(`${mockApiUrl}/api/auth/login`, {
      data: { usernameOrEmail: username, password },
    });
    const { data } = await loggedIn.json();
    const company = await request.post(`${mockApiUrl}/api/companies/verification-request`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
      data: {
        name: `Pagination Company ${index}`,
        taxCode: `09900000${String(index).padStart(2, "0")}`,
        email: `company_${index}@example.test`,
        registrationCertificateUrl: "https://example.test/license.pdf",
      },
    });
    expect(company.status()).toBe(201);
  }
  await login(page, "admin_demo");
  const response = page.waitForResponse(
    (response) =>
      response.url().includes("/api/staff/companies/verifications") &&
      response.url().includes("size=20"),
  );
  await page.goto("/admin/verifications", { waitUntil: "domcontentloaded" });
  await response;
  const pagination = page.getByRole("navigation", { name: "Phân trang hồ sơ xác minh" });
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await expect(pagination.getByRole("status")).toHaveText("1–20 / 21 hồ sơ");
  await pagination.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("pagination-first.png"),
    animations: "disabled",
  });
  await pagination.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(pagination.getByRole("status")).toHaveText("21–21 / 21 hồ sơ");
  await expect(pagination.getByRole("button", { name: "Trang sau", exact: true })).toBeDisabled();
  await pagination.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("pagination-last.png"),
    animations: "disabled",
  });
  await pagination.getByRole("button", { name: "Trang trước", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await pagination.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("combobox", { name: "Lọc trạng thái hồ sơ" }).selectOption("VERIFIED");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(pagination.getByRole("status")).toHaveText("0–0 / 0 hồ sơ");
  await expect(pagination.getByRole("button", { name: "Trang trước", exact: true })).toBeDisabled();
  await page.getByRole("combobox", { name: "Lọc trạng thái hồ sơ" }).selectOption("ALL");
  await expect(page.locator("tbody tr")).toHaveCount(20);
  await expect(pagination.getByRole("status")).toHaveText("1–20 / 21 hồ sơ");
});
