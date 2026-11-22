import { test, expect, login } from "./fixtures";

const content = {
  title: "Chuyên viên điều phối kho lạnh",
  description: "Mô tả công việc dùng cho kiểm thử chặn ứng tuyển.",
  location: "TP. Hồ Chí Minh",
  employmentType: "FULL_TIME",
  workArrangement: "ON_SITE",
  compensation: { disclosed: false },
};

function jobDetail(id: number, company: { id: number; name: string }) {
  return {
    id,
    company,
    content,
    publicationStatus: "PUBLISHED",
    approvedDeadline: null,
    applicationsAvailable: true,
    applicationAvailabilityReason: null,
  };
}

test("owner cannot apply to their own company's posting", async ({ page }, info) => {
  await page.route("**/api/jobs/9001", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: jobDetail(9001, { id: 101, name: "Công ty TNHH Giải Pháp Alpha" }),
      },
    }),
  );
  await login(page, "owner_demo");
  await page.goto("/can/jobs?job=9001");

  const card = page.locator(".career-apply-card");
  await expect(
    card.getByRole("heading", { name: "Tin do công ty bạn đăng", exact: true }),
  ).toBeVisible();
  await expect(card).toContainText("Bạn đang là chủ sở hữu tại Công ty TNHH Giải Pháp Alpha");
  await expect(card.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toHaveCount(0);
  await expect(card.locator(".career-applied-state")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("owner-self-company-detail.png"),
    fullPage: true,
    animations: "disabled",
  });

  await page.goto("/can/jobs/apply?job=9001");
  await expect(
    page.getByRole("heading", { name: "Không thể ứng tuyển tin của công ty bạn", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".apply-form")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("owner-self-company-apply.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("candidate with an existing application sees no apply action for that job", async ({
  page,
}, info) => {
  await page.route("**/api/jobs/9001", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: jobDetail(9001, {
          id: 201,
          name: "Công ty TNHH Vận tải & Kho lạnh Việt Thành",
        }),
      },
    }),
  );
  await page.route("**/api/candidate/applications?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: [
            {
              id: "app-guard",
              jobId: 9001,
              jobTitle: content.title,
              companyId: 201,
              companyName: "Công ty TNHH Vận tải & Kho lạnh Việt Thành",
              status: "SUBMITTED",
              appliedAt: "2026-11-01T08:30:00Z",
              cvFileName: "CV.pdf",
            },
          ],
          pageNumber: 0,
          pageSize: 100,
          totalElements: 1,
          totalPages: 1,
        },
      },
    }),
  );
  await login(page, "candidate_demo");
  await page.goto("/can/jobs?job=9001");

  const card = page.locator(".career-apply-card");
  await expect(card).toContainText("Đã nộp hồ sơ");
  await expect(card.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("candidate-already-applied-detail.png"),
    fullPage: true,
    animations: "disabled",
  });

  await page.goto("/can/jobs/apply?job=9001");
  await expect(
    page.getByRole("heading", { name: "Bạn đã ứng tuyển vị trí này", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".apply-form")).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath("candidate-already-applied-apply.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("candidate without an application still reaches the apply action", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.goto("/can/jobs?job=9002");

  const card = page.locator(".career-apply-card");
  await expect(card.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toBeVisible();
  await expect(card).not.toContainText("Đã nộp hồ sơ");
});
