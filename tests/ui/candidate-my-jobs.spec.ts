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
  await expect(page.getByRole("button", { name: "Tất cả (11)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã ứng tuyển (5)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đang xem xét (4)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Từ chối (2)", exact: true })).toBeVisible();
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

  await page.getByRole("button", { name: "Từ chối (2)", exact: true }).click();
  await expect(page.locator(".application-card")).toHaveCount(2);
  await expect(page.locator(".application-card__status-tag")).toHaveText(["Từ chối", "Từ chối"]);

  await page.getByRole("button", { name: "Tất cả (11)", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Tìm theo tên công việc hoặc công ty", exact: true })
    .fill("alpha");
  await expect(page.locator(".application-card")).toHaveCount(1);
  await expect(page.locator(".application-card__title")).toHaveText("Kỹ sư Backend (Go)");
  await expect(page.locator(".my-jobs-count")).toContainText("1 đơn");
  await expect(page.getByRole("link", { name: "Đã ứng tuyển (11)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tất cả (1)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã ứng tuyển (0)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đang xem xét (1)", exact: true })).toBeVisible();

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
  await expect(page.getByRole("button", { name: "Rejected (2)", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submitted (5)", exact: true })).toBeVisible();
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
