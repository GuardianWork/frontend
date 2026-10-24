import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
async function recruiter(page: Page) {
  let left = false;
  await page.route("**/api/auth/me", async (route) => {
    const body = {
      status: 200,
      data: {
        id: 2,
        username: "recruiter_demo",
        email: "recruiter@example.test",
        firstName: "Linh",
        lastName: "Trần",
        role: "USER",
        activeMembership: null as object | null,
      },
    };
    body.data.activeMembership = left
      ? null
      : {
          companyId: 101,
          companyName: "Alpha",
          companyRole: "RECRUITER",
          joinedAt: "2026-10-21T00:00:00Z",
        };
    await route.fulfill({ json: body });
  });
  await login(page, "recruiter_demo", true);
  if (page.viewportSize()!.width < 768)
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.getByRole("button", { name: "Rời công ty", exact: true }).click();
  return () => {
    left = true;
  };
}
test("recruiter confirms leaving through the API and loses cached company membership", async ({
  page,
}) => {
  let requests = 0;
  const markLeft = await recruiter(page);
  await page.route("**/api/companies/me/membership/leave", async (route) => {
    requests++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postData()).toBeNull();
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    markLeft();
    await route.fulfill({
      json: {
        status: 200,
        data: { membershipId: 22, status: "LEFT", endedAt: new Date().toISOString() },
      },
    });
  });
  await expect(page.getByRole("dialog")).toContainText("Alpha");
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: `test-results/leave-company-${test.info().project.name}.png` });
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Xác nhận rời công ty" }).click();
  await expect(page).toHaveURL(/\/vn$/);
  expect(requests).toBe(1);
  const user = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem("guardianwork_auth_session")!).user,
  );
  expect(user.activeMembership).toBeNull();
});
test("cancel sends no request and API failure retains membership with an error", async ({
  page,
}) => {
  let requests = 0;
  await recruiter(page);
  await page.route("**/api/companies/me/membership/leave", (route) => {
    requests++;
    return route.fulfill({ status: 403, json: { status: 403, message: "NOT_COMPANY_MEMBER" } });
  });
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Rời công ty", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận rời công ty" }).click();
  await expect(page.getByRole("alert")).toContainText("Vui lòng tải lại trang");
  await expect(page.getByRole("button", { name: "Xác nhận rời công ty" })).toBeEnabled();
  expect(requests).toBe(1);
});
test("Owner has no leave company action", async ({ page }) => {
  await login(page, "owner_demo", true);
  if (page.viewportSize()!.width < 768)
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rời công ty", exact: true })).toHaveCount(0);
});
