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
  const companies = Array.from({ length: 21 }, (_, index) => ({
    id: 101 + index,
    name: `Pagination Company ${index}`,
    taxCode: `09900000${String(index).padStart(2, "0")}`,
    verificationStatus: "PENDING",
    version: 0,
    createdAt: "2026-10-21T00:00:00Z",
  }));
  await page.route("**/api/staff/companies/verifications?**", (route) => {
    const params = new URL(route.request().url()).searchParams;
    const rows = params.get("status") === "VERIFIED" ? [] : companies;
    const number = Number(params.get("page") || 0),
      size = 20;
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: rows.slice(number * size, (number + 1) * size),
          pageNumber: number,
          pageSize: size,
          totalElements: rows.length,
          totalPages: Math.ceil(rows.length / size),
          first: number === 0,
          last: (number + 1) * size >= rows.length,
        },
      },
    });
  });
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
