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
  let removalAttempts = 0;
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
                  firstName: "Nguyễn招聘🙂".repeat(20),
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
    removalAttempts++;
    if (removalAttempts === 1)
      return route.fulfill({
        status: 503,
        json: { status: 503, message: "Không thể xóa thành viên. Vui lòng thử lại." },
      });
    removed = true;
    return route.fulfill({ json: { status: 200, data: { membershipId: 71, status: "REMOVED" } } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/members");
  await expect(page.locator("tbody")).toContainText("server@example.test");
  await page.screenshot({ path: "/tmp/backend-members-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("region", { name: "Bảng thành viên công ty" })).toBeVisible();
  await page.getByRole("region", { name: "Bảng thành viên công ty" }).focus();
  await expect(page.getByRole("region", { name: "Bảng thành viên công ty" })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/backend-members-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Xóa thành viên", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xóa thành viên", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(page.locator("tbody")).toContainText("server@example.test");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xóa thành viên", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("tbody")).not.toContainText("server@example.test");
  expect(removed).toBe(true);
  expect(removalAttempts).toBe(2);
  await page.goto("/recruiter");
  await page.getByRole("searchbox").fill("khong-co-ung-vien");
  await expect(
    page.getByText("Không tìm thấy ứng viên phù hợp. Hãy đổi từ khóa hoặc bộ lọc."),
  ).toBeVisible();
  await expect(page.getByRole("group", { name: "Tiến độ tuyển dụng", exact: true })).toHaveCount(0);
  await page.getByRole("searchbox").fill("React Native");
  await expect(page.locator(".workspace-detail-header")).toContainText("Kỹ sư Di động Cấp cao");
  const stages = page.getByRole("group", { name: "Tiến độ tuyển dụng", exact: true });
  await stages.getByRole("button", { name: "Đã đánh giá", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(stages.getByRole("button", { name: "Đã đánh giá", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/recruiter-harden-mobile.png" });
});
