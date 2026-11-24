import { test, expect, login } from "./fixtures";

test("suspended applications conceal evidence and allow only eligible withdrawals", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  let status = "SUBMITTED";
  let version = 2;
  const writes: unknown[] = [];
  const row = () => ({
    id: "suspended-application",
    jobId: 42,
    jobTitle: "Chuyên viên kinh doanh",
    companyId: 101,
    companyName: "Công ty Alpha",
    status,
    version,
    jobSuspended: true,
    appliedAt: "2026-11-01T08:30:00Z",
    cvFileName: "private-resume.pdf",
    canViewCv: true,
    candidateFeedback: "Phản hồi cần ẩn",
    suspensionReason: "Lý do nội bộ",
    suspendedBy: "Nhân viên xử lý",
    history: [
      {
        toStatus: "SUBMITTED",
        occurredAt: "2026-11-01T08:30:00Z",
        candidateFeedback: "Phản hồi cần ẩn",
      },
    ],
  });
  await page.route(/\/api\/candidate\/applications(?:\?|\/|$)/, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/withdraw")) {
      writes.push(route.request().postDataJSON());
      status = "WITHDRAWN";
      version++;
    }
    return route.fulfill({ json: { data: path.endsWith("applications") ? [row()] : row() } });
  });
  for (const current of [
    "SUBMITTED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEWING",
    "INACTIVE",
    "HIRED",
    "REJECTED",
    "WITHDRAWN",
  ]) {
    status = current;
    await page.goto("/can/applied?application=suspended-application");
    const card = page.locator(".application-card");
    await expect(card.locator(".application-card__status-text")).toHaveText(
      "Tin tuyển dụng đang bị tạm ngưng",
    );
    await expect(
      card.getByText(
        "Thông tin tin tuyển dụng, lịch sử trạng thái, phản hồi và CV bị giới hạn trong thời gian tin tạm ngưng.",
      ),
    ).toBeVisible();
    await expect(card).toContainText("Công ty Alpha");
    await expect(card).toContainText("01/11/2026");
    await expect(
      card.locator("a, .application-progress__timeline, .application-card__cv"),
    ).toHaveCount(0);
    await expect(card.getByRole("button", { name: "Tải CV đã gửi" })).toHaveCount(0);
    for (const hidden of [
      "Lý do nội bộ",
      "Nhân viên xử lý",
      "Phản hồi cần ẩn",
      "private-resume.pdf",
      "Chưa có lịch sử trạng thái.",
    ]) {
      await expect(card.getByText(hidden)).toHaveCount(0);
    }
    const withdraw = card.getByRole("button", { name: "Rút đơn ứng tuyển", exact: true });
    if (["HIRED", "REJECTED", "WITHDRAWN"].includes(current)) {
      await expect(withdraw).toHaveCount(0);
    } else {
      await expect(withdraw).toBeVisible();
      if (current === "INACTIVE") {
        await page.screenshot({
          path: info.outputPath("candidate-suspended-desktop.png"),
          animations: "disabled",
        });
        await withdraw.click();
        await page.getByRole("button", { name: "Xác nhận rút đơn", exact: true }).click();
        await expect(card.locator(".application-card__status-tag")).toHaveText("Đã rút");
      }
    }
  }
  expect(writes).toEqual([{ version: 2 }]);
});

test("fresh application details apply suspension and restoration without reopening the public JD", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  let suspended = true;
  let canViewCv = false;
  const row = () => ({
    id: "restore-application",
    jobId: 42,
    jobTitle: "Chuyên viên kinh doanh",
    companyId: 101,
    companyName: "Công ty Alpha",
    status: "UNDER_REVIEW",
    version: 3,
    jobSuspended: suspended,
    appliedAt: "2026-11-01T08:30:00Z",
    cvFileName: "resume.pdf",
    canViewCv,
    history: [
      {
        toStatus: "SUBMITTED",
        occurredAt: "2026-11-01T08:30:00Z",
        candidateFeedback: "Phản hồi từ công ty",
      },
    ],
  });
  let publicReads = 0;
  await page.route("**/api/jobs/42", (route) => {
    publicReads++;
    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });
  await page.route(/\/api\/candidate\/applications(?:\?|\/|$)/, (route) => {
    const path = new URL(route.request().url()).pathname;
    // Deliberately stale list: detail must determine the current restriction.
    return route.fulfill({
      json: { data: path.endsWith("applications") ? [{ ...row(), jobSuspended: false }] : row() },
    });
  });
  await page.goto("/can/applied?application=restore-application");
  const card = page.locator(".application-card");
  await expect(card.locator(".application-card__status-text")).toHaveText(
    "Tin tuyển dụng đang bị tạm ngưng",
  );
  await expect(card.locator("a")).toHaveCount(0);
  suspended = false;
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(card.getByText("Phản hồi từ công ty")).toBeVisible({ timeout: 12000 });
  await expect(
    card.getByRole("link", { name: "Xem tin tuyển dụng: Chuyên viên kinh doanh" }),
  ).toBeVisible();
  await expect(card.getByRole("button", { name: "Tải CV đã gửi" })).toHaveCount(0);
  canViewCv = true;
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(card.getByRole("button", { name: "Tải CV đã gửi" })).toBeVisible({ timeout: 12000 });
  expect(publicReads).toBe(0);
});
