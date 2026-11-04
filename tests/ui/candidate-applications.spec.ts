import { test, expect, login } from "./fixtures";

test("candidate tracks submitted applications, filters by status and searches by company", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await page.getByRole("link", { name: "Công việc đã ứng tuyển", exact: true }).click();
  await expect(page).toHaveURL(/\/can\/applications$/);
  await expect(
    page.getByRole("heading", { name: "Công việc đã ứng tuyển", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".application-ledger__item")).toHaveCount(10);
  await expect(page.locator(".application-ledger__count")).toContainText("11 đơn");
  await expect(page.getByRole("button", { name: "Tất cả (11)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã nộp (5)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã xem (4)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Từ chối (2)", exact: true })).toBeVisible();
  await expect(page.locator(".application-ledger__columns")).toContainText("Ngày ứng tuyển");
  await expect(page.locator(".application-ledger__columns")).toContainText("Hồ sơ đã gửi");

  await page.getByRole("button", { name: "Từ chối (2)", exact: true }).click();
  await expect(page.locator(".application-ledger__item")).toHaveCount(2);
  await expect(page.locator(".application-ledger__status")).toHaveText(["Từ chối", "Từ chối"]);

  await page.getByRole("button", { name: "Tất cả (11)", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Tìm theo tên công việc hoặc công ty", exact: true })
    .fill("alpha");
  await expect(page.locator(".application-ledger__item")).toHaveCount(1);
  await expect(page.locator(".application-ledger__title")).toHaveText("Kỹ sư Backend (Go)");
  await expect(page.locator(".application-ledger__count")).toContainText("1 đơn");
  await expect(page.getByRole("button", { name: "Tất cả (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã nộp (0)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã xem (1)", exact: true })).toBeVisible();

  await page
    .getByRole("searchbox", { name: "Tìm theo tên công việc hoặc công ty", exact: true })
    .fill("không có công việc này");
  await expect(
    page.getByRole("heading", { name: "Không có đơn ứng tuyển phù hợp", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".application-ledger__item")).toHaveCount(10);

  await page.screenshot({
    path: ".impeccable/review/candidate-applications-1440.png",
    animations: "disabled",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".application-ledger__item")).toHaveCount(1);
  await expect(page.locator(".application-ledger__title")).toHaveText(
    "Thiết kế Trải nghiệm Người dùng",
  );

  await page.getByRole("button", { name: "Chuyển sang tiếng Anh", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Jobs you have applied to", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Rejected (2)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submitted (5)", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search by job or company" })).toBeVisible();
});

test("a candidate with no submissions sees the genuine empty state", async ({
  page,
  mockApiUrl,
}) => {
  await page.request.post(`${mockApiUrl}/api/auth/register`, {
    data: {
      firstName: "Mai",
      lastName: "Phạm",
      username: "no_applications_demo",
      email: "noapplications@example.test",
      password: "Guardian123!",
    },
  });
  await login(page, "no_applications_demo");
  await page.goto("/can/applications");
  await expect(
    page.getByRole("heading", { name: "Bạn chưa ứng tuyển công việc nào", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Tìm việc làm", exact: true }).last()).toBeVisible();
  await expect(page.locator(".application-ledger__item")).toHaveCount(0);
});
