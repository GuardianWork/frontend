import { expect, test, login } from "./fixtures";

test.describe("candidate profile", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "candidate_demo");
    await page.goto("/can/profile", { waitUntil: "domcontentloaded" });
  });

  test("renders API identity with the existing illustrative experience records", async ({
    page,
  }) => {
    await expect(page.getByRole("heading", { name: "Hồ sơ cá nhân" })).toBeVisible();
    await expect(
      page.getByText("Senior Tech Lead & Systems Engineer", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Cử nhân Khoa học Máy tính", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "An Nguyễn", exact: true })).toBeVisible();
  });

  test("adds education and experience, then syncs saved values to the profile", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Chỉnh sửa kinh nghiệm làm việc" }).click();

    await page
      .locator("form button")
      .filter({ hasText: "Thêm kinh nghiệm làm việc" })
      .click({ force: true });
    await expect(page.getByText("Kinh nghiệm 3", { exact: true })).toBeVisible();
    await page.getByLabel("Chức danh").nth(2).fill("Staff Platform Engineer");
    await page.getByLabel("Công ty / Địa điểm").nth(2).fill("Guardian Labs • Hà Nội");
    await page.locator('input[type="month"]').nth(4).fill("2024-07");
    await page
      .getByLabel("Mô tả công việc")
      .nth(2)
      .fill("Xây dựng nền tảng tuyển dụng đáng tin cậy.");
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByRole("dialog")).toContainText("Kinh nghiệm làm việc đã được cập nhật.");
    await page.getByRole("button", { name: "Đóng" }).click();

    await page.getByRole("button", { name: "Chỉnh sửa học vấn" }).click();
    await page.getByRole("button", { name: "Thêm trình độ học vấn" }).click();
    await expect(page.getByText("Học vấn 2", { exact: true })).toBeVisible();

    const educationSchools = page.getByLabel("Trường / Cơ sở đào tạo");
    await educationSchools.nth(1).fill("Đại học Bách khoa Hà Nội");
    await page.getByLabel("Bằng cấp").nth(1).fill("Thạc sĩ Khoa học Máy tính");
    await page.locator('input[type="month"]').nth(2).fill("2022-09");
    await page.locator('input[type="month"]').nth(3).fill("2024-06");

    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByRole("dialog")).toContainText("Học vấn đã được cập nhật.");
    await page.getByRole("button", { name: "Đóng" }).click();
    await expect(page.getByText("Đại học Bách khoa Hà Nội", { exact: true })).toBeVisible();
    await expect(page.getByText("Thạc sĩ Khoa học Máy tính", { exact: true })).toBeVisible();
    await expect(page.getByText("Staff Platform Engineer", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Xây dựng nền tảng tuyển dụng đáng tin cậy.", { exact: true }),
    ).toBeVisible();
  });

  test("shows inline validation and removes an added education entry", async ({ page }) => {
    await page.getByRole("button", { name: "Chỉnh sửa học vấn" }).click();
    await page.getByRole("button", { name: "Thêm trình độ học vấn" }).click();
    await expect(page.getByText("Học vấn 2", { exact: true })).toBeVisible();
    await page.getByLabel("Trường / Cơ sở đào tạo").nth(1).fill("Đại học thử nghiệm");

    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Nhập bằng cấp" })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "Chọn ngày bắt đầu" })).toBeVisible();

    await page.locator("form button").filter({ hasText: "Xóa" }).last().click();
    await expect(page.getByText("Học vấn 2", { exact: true })).not.toBeVisible();
  });
});
