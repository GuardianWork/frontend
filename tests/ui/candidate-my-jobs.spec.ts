import { test, expect, login } from "./fixtures";

test("candidate tracks applications under My jobs, filters, searches and opens a receipt", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await page.getByRole("link", { name: "Công việc của tôi", exact: true }).click();
  await expect(page).toHaveURL(/\/can\/applied$/);
  await expect(page.getByRole("heading", { name: "Công việc của tôi", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đã ứng tuyển (11)", exact: true })).toBeVisible();
  await expect(page.locator(".application-card")).toHaveCount(10);
  await expect(page.locator(".my-jobs-count")).toContainText("11 đơn");
  await expect(page.locator('select[aria-label="Lọc theo trạng thái"] option')).toHaveText([
    "Tất cả (11)",
    "Đã ứng tuyển (4)",
    "Đang xem xét (3)",
    "Hồ sơ qua vòng (1)",
    "Đã từ chối (2)",
    "Đã rút (1)",
  ]);
  await expect(page.locator(".my-jobs-order")).toContainText("Đơn nộp mới nhất trước");

  const firstCard = page.locator(".application-card").first();
  await expect(firstCard.locator(".application-card__title")).toHaveText("Kỹ sư Backend (Go)");
  await expect(firstCard.locator(".application-card__meta")).toContainText("TP. Hồ Chí Minh");
  await expect(firstCard.locator(".application-card__meta")).toContainText("Tại văn phòng");
  await expect(firstCard.locator(".application-card__meta")).toContainText("Hạn nộp 30/11/2026");
  await expect(firstCard.locator(".application-card__applied")).toContainText("30/10/2026");
  await expect(page.getByText("Hết hạn ứng tuyển").first()).toBeVisible();

  await firstCard.locator(".application-card__status").click();
  await expect(firstCard.locator(".application-card__receipt")).toBeVisible();
  await expect(firstCard.locator(".application-card__cv")).toContainText(
    "Nguyen_Van_An_Backend_CV_2026.pdf",
  );
  await expect(
    firstCard.getByRole("link", {
      name: "Xem tin tuyển dụng: Kỹ sư Backend (Go)",
      exact: true,
    }),
  ).toBeVisible();
  await firstCard.locator(".application-card__status").click();
  await expect(firstCard.locator(".application-card__receipt")).toBeHidden();

  await page.locator('select[aria-label="Lọc theo trạng thái"]').selectOption({
    label: "Đã từ chối (2)",
  });
  await expect(page.locator(".application-card")).toHaveCount(2);
  await expect(page.locator(".application-card__status-tag")).toHaveText([
    "Hồ sơ bị từ chối",
    "Hồ sơ bị từ chối",
  ]);

  await page.locator('select[aria-label="Lọc theo trạng thái"]').selectOption({
    label: "Tất cả (11)",
  });
  await page
    .getByRole("searchbox", { name: "Tìm theo tên công việc hoặc công ty", exact: true })
    .fill("alpha");
  await expect(page.locator(".application-card")).toHaveCount(1);
  await expect(page.locator(".application-card__title")).toHaveText("Kỹ sư Backend (Go)");
  await expect(page.locator(".my-jobs-count")).toContainText("1 đơn");
  await expect(page.locator('select[aria-label="Lọc theo trạng thái"] option')).toHaveText([
    "Tất cả (1)",
    "Đã ứng tuyển (0)",
    "Đang xem xét (1)",
    "Hồ sơ qua vòng (0)",
    "Đã từ chối (0)",
    "Đã rút (0)",
  ]);

  await page
    .getByRole("searchbox", { name: "Tìm theo tên công việc hoặc công ty", exact: true })
    .fill("không có công việc này");
  await expect(
    page.getByRole("heading", { name: "Không có đơn ứng tuyển phù hợp", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(page.locator(".application-card")).toHaveCount(10);

  await page.screenshot({
    path: ".impeccable/review/candidate-my-jobs-1440.png",
    animations: "disabled",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.locator(".application-card")).toHaveCount(1);
  await expect(page.locator(".application-card__title")).toHaveText(
    "Thiết kế Trải nghiệm Người dùng",
  );

  await page.getByRole("button", { name: "Chuyển sang tiếng Anh", exact: true }).click();
  await expect(page.getByRole("heading", { name: "My jobs", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Applied (11)", exact: true })).toBeVisible();
  await expect(page.locator('select[aria-label="Filter by status"] option')).toHaveText([
    "All (11)",
    "Submitted (4)",
    "Under review (3)",
    "Shortlisted (1)",
    "Rejected (2)",
    "Withdrawn (1)",
  ]);
  await expect(page.getByRole("searchbox", { name: "Search by job or company" })).toBeVisible();
});

test("the old applications route redirects to the My jobs page", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.goto("/can/applications");
  await expect(page).toHaveURL(/\/can\/applied$/);
  await expect(page.getByRole("heading", { name: "Công việc của tôi", exact: true })).toBeVisible();
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
  await page.goto("/can/applied");
  await expect(
    page.getByRole("heading", { name: "Bạn chưa ứng tuyển công việc nào", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Tìm việc làm", exact: true }).last()).toBeVisible();
  await expect(page.locator(".application-card")).toHaveCount(0);
});
