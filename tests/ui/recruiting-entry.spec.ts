import { test, expect, login } from "./fixtures";

for (const { entry, label } of [
  { entry: "For companies", label: "Dành cho công ty" },
  { entry: "Start hiring", label: "Bắt đầu tuyển dụng" },
]) {
  test(`${entry} opens recruiter registration for guests`, async ({ page }) => {
    await page.goto("/vn", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(/\/register\?role=recruiter$/);
  });

  test(`${entry} opens company setup options for a signed-in user without a membership`, async ({
    page,
  }) => {
    await login(page, "candidate_demo");
    await page.goto("/vn", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(/\/rec\/?$/);
    await expect(page.getByRole("heading", { name: "Kết nối với công ty của bạn" })).toBeVisible();
  });

  test(`${entry} opens the recruiter workspace for a signed-in company member`, async ({
    page,
  }) => {
    await login(page, "owner_demo", true);
    await page.goto("/vn", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(/\/rec\/?$/);
    await expect(page.locator(".recruiter-workspace")).toBeVisible();
  });
}
