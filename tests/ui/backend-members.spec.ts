import { test, expect, login } from "./fixtures";

test("members use server data and removal refreshes the list", async ({ page }) => {
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
  let removed = false;
  await page.route("**/api/companies/me/members?*", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: removed
            ? []
            : [
                {
                  membershipId: 71,
                  userId: 92,
                  firstName: "Backend",
                  lastName: "Member",
                  email: "server@example.test",
                  companyRole: "RECRUITER",
                  status: "ACTIVE",
                  joinedAt: "2026-10-01T00:00:00Z",
                },
              ],
          totalElements: removed ? 0 : 1,
          totalPages: removed ? 0 : 1,
        },
      },
    }),
  );
  await page.route("**/api/companies/me/members/71", (route) => {
    expect(route.request().method()).toBe("DELETE");
    removed = true;
    return route.fulfill({ json: { status: 200, data: { membershipId: 71, status: "REMOVED" } } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/members");
  await expect(page.locator("tbody")).toContainText("server@example.test");
  await page.screenshot({ path: "/tmp/backend-members-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "/tmp/backend-members-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Xóa thành viên", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xóa thành viên", exact: true })
    .click();
  await expect(page.locator("tbody")).not.toContainText("server@example.test");
  expect(removed).toBe(true);
});
