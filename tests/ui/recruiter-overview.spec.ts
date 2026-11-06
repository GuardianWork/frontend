import { test, expect, login } from "./fixtures";

for (const role of ["OWNER", "RECRUITER"]) {
  test(`${role} overview leads to implemented recruiting workflows`, async ({ page }) => {
    await page.route("**/api/companies/me/verification", (route) =>
      route.fulfill({
        json: {
          status: 200,
          data: {
            id: 101,
            name: "Alpha",
            taxCode: "0101234567",
            verificationStatus: "VERIFIED",
            version: 1,
          },
        },
      }),
    );
    await login(page, "owner_demo", true);
    if (role === "RECRUITER") {
      await page.route("**/api/auth/me", (route) =>
        route.fulfill({
          json: {
            status: 200,
            data: {
              id: 3,
              username: "owner_demo",
              email: "owner@example.test",
              fullName: "Nguyễn Minh Anh",
              role: "USER",
              emailVerified: true,
              recruitingEmailEligible: true,
              activeMembership: {
                companyId: 101,
                companyName: "Alpha",
                companyRole: "RECRUITER",
                joinedAt: "2026-10-27T01:00:00Z",
              },
            },
          },
        }),
      );
      await page.route("**/api/companies/me", (route) =>
        route.fulfill({
          json: {
            status: 200,
            data: { companyId: 101, companyRole: "RECRUITER", verificationStatus: "VERIFIED" },
          },
        }),
      );
    }
    await page.goto("/rec");
    await expect(page.getByRole("heading", { name: "Tổng quan tuyển dụng" })).toBeVisible();
    const main = page.locator("main");
    const work = main.getByRole("region", { name: "Công việc tuyển dụng" });
    await expect(work.getByRole("link", { name: /^Tin tuyển dụng/ })).toHaveAttribute(
      "href",
      "/rec/jobs",
    );
    await expect(main.locator('a[href="/rec/talent"]')).toHaveCount(0);
    await expect(main).not.toContainText("minh họa");
    await expect(main).not.toContainText("Phù hợp cao");
    await expect(main.locator(".workspace-summary, .workspace-split")).toHaveCount(0);
    await expect(work.getByRole("link", { name: /^Hồ sơ công ty/ })).toHaveCount(
      role === "OWNER" ? 1 : 0,
    );
    expect(await main.evaluate((node) => node.scrollWidth > node.clientWidth + 1)).toBe(false);
    await page.screenshot({ path: `/tmp/recruiter-overview-${role}.png`, fullPage: true });
    const applications = work.getByRole("link", { name: /^Đơn ứng tuyển/ });
    await applications.focus();
    await expect(applications).toBeFocused();
    await applications.press("Enter");
    await expect(page).toHaveURL(/\/rec\/applications$/);
    await expect(page.getByRole("heading", { name: "Đơn ứng tuyển", exact: true })).toBeVisible();
  });
}
