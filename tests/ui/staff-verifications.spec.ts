import { test, expect, login } from "./fixtures";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
const name = "Công ty TNHH Giải Pháp Alpha";
async function openDossier(page: import("@playwright/test").Page) {
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/verifications`);
  await page.getByRole("button", { name: /Mở hồ sơ/ }).click();
}
test("legacy dossier remains reviewable and rejection refreshes queue and details", async ({
  page,
}, info) => {
  await openDossier(page);
  await page.screenshot({ path: info.outputPath("verification-detail.png"), fullPage: true });
  await expect(page.getByText(/Không có lịch sử nộp hồ sơ được lưu giữ/)).toBeVisible();
  await page.getByRole("button", { name: "Từ chối hồ sơ", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("textarea").fill("short");
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await dialog.locator("textarea").fill("  Thông tin giấy phép không khớp hồ sơ.  ");
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(page.getByText("Đã từ chối hồ sơ và lưu lý do.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Phê duyệt", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await expect(page.getByRole("heading", { name: "Không có hồ sơ trong mục này" })).toBeVisible();
});
test("history errors retain summary, retry reveals submission and authenticated download", async ({
  page,
}) => {
  let broken = true;
  await page.route("**/api/staff/companies/101/verification-history", async (route) => {
    await route.fulfill({
      status: broken ? 503 : 200,
      json: broken
        ? { message: "unavailable" }
        : {
            data: [
              {
                attemptId: "attempt-1",
                companyId: 101,
                companyName: name,
                taxCode: "0101234567",
                workAddress: "Địa chỉ làm việc mẫu",
                submitterPosition: "Giám đốc",
                representation: "LEGAL_REPRESENTATIVE",
                declarationText: "Tôi cam kết thông tin chính xác.",
                declarationVersion: "v1",
                documentId: "doc-1",
                submittedAt: "2026-10-19T02:00:00Z",
                outcome: null,
                rejectionReason: null,
                reviewerId: null,
                reviewedAt: null,
              },
            ],
          },
    });
  });
  await page.route("**/api/company-verification-documents/doc-1", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer mock-access-/);
    await route.fulfill({
      body: "sample evidence",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="evidence.pdf"',
      },
    });
  });
  await openDossier(page);
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử tải lại lịch sử" })).toBeVisible();
  broken = false;
  await page.getByRole("button", { name: "Thử tải lại lịch sử" }).click();
  await page.locator(".verification-history-summary").click();
  await expect(page.getByText("Tôi cam kết thông tin chính xác.")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải tài liệu xác minh", exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe("evidence.pdf");
});
test("conflict keeps rejection reason and requires a queue reload before reopening", async ({
  page,
}) => {
  let queueLoads = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/staff/companies/verifications?")) queueLoads++;
  });
  await page.route("**/api/staff/companies/101/verify", (route) =>
    route.fulfill({ status: 409, json: { message: "40022 CONCURRENT_MODIFICATION" } }),
  );
  await openDossier(page);
  await page.getByRole("button", { name: "Từ chối hồ sơ", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("textarea").fill("Thông tin giấy phép không khớp hồ sơ.");
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await expect(dialog.locator("textarea")).toHaveValue("Thông tin giấy phép không khớp hồ sơ.");
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  const before = queueLoads;
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await page.getByRole("button", { name: /Mở hồ sơ/ }).click();
  expect(queueLoads).toBeGreaterThan(before);
  await expect(page.getByRole("button", { name: "Phê duyệt", exact: true })).toBeEnabled();
});

test("approval updates the summary and reloads both queue and history", async ({ page }) => {
  let historyLoads = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/verification-history")) historyLoads++;
  });
  await openDossier(page);
  await expect(page.getByText(/Không có lịch sử nộp hồ sơ được lưu giữ/)).toBeVisible();
  const before = historyLoads;
  await page.getByRole("button", { name: "Phê duyệt", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xác nhận phê duyệt" }).click();
  await expect(page.getByText("Hồ sơ đã được xác minh.", { exact: true })).toBeVisible();
  await expect.poll(() => historyLoads).toBeGreaterThan(before);
  await expect(page.getByRole("button", { name: "Phê duyệt", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await expect(page.getByRole("heading", { name: "Không có hồ sơ trong mục này" })).toBeVisible();
});

test("submission history sorts, expands, searches all pages and paginates", async ({
  page,
}, info) => {
  await page.route("**/api/staff/companies/101/verification-history", (route) =>
    route.fulfill({
      json: {
        data: Array.from({ length: 12 }, (_, index) => ({
          attemptId: `attempt-${index}`,
          companyId: 101,
          companyName: name,
          taxCode: "0101234567",
          workAddress: `Địa chỉ lần ${index + 1}`,
          submitterPosition: "Giám đốc",
          representation: "LEGAL_REPRESENTATIVE",
          declarationText: `Cam kết lần ${index + 1}`,
          declarationVersion: "v1",
          documentId: `doc-${index}`,
          submittedAt: `2026-10-${String(index + 1).padStart(2, "0")}T02:00:00Z`,
          outcome: index === 11 ? null : "REJECTED",
          rejectionReason: index === 11 ? null : "Thiếu tài liệu",
          reviewerId: null,
          reviewedAt: null,
        })),
      },
    }),
  );
  await openDossier(page);
  const history = page.getByRole("region", { name: "Lịch sử gửi hồ sơ" });
  const summaries = history.locator("summary");
  await expect(summaries).toHaveCount(10);
  await expect(summaries.first()).toContainText("Lần gửi 12");
  await expect(history.getByText("Cam kết lần 12", { exact: true })).toBeHidden();
  await summaries.first().focus();
  await page.keyboard.press("Enter");
  await expect(history.getByText("Cam kết lần 12", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("history-expanded.png"), fullPage: true });
  await page.keyboard.press("Enter");
  await expect(history.getByText("Cam kết lần 12", { exact: true })).toBeHidden();
  await history.getByRole("button", { name: "Trang sau" }).click();
  await expect(summaries).toHaveCount(2);
  await expect(summaries.first()).toContainText("Lần gửi 2");
  const search = history.getByRole("searchbox");
  await search.fill("cho duyet");
  await expect(summaries).toHaveCount(1);
  await expect(summaries.first()).toContainText("Lần gửi 12");
  await search.fill("không tồn tại");
  await expect(history.getByText("Không tìm thấy lần gửi phù hợp")).toBeVisible();
  await search.fill("");
  await expect(summaries).toHaveCount(10);
  await page.screenshot({ path: info.outputPath("history-collapsed.png"), fullPage: true });
});
