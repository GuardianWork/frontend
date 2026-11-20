import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

async function prepareDetail(page: import("@playwright/test").Page) {
  const api = await staffJobApi(page);
  const latest = { scan: null as ReturnType<typeof completedScan> | null, fail: false, reads: 0 };
  await page.route("**/api/staff/job-revisions/91/scans/latest?*", (route) => {
    latest.reads++;
    expect(new URL(route.request().url()).searchParams.get("expectedRevisionVersion")).toBe(
      String(api.review.revisionVersion),
    );
    return route.fulfill(
      latest.fail
        ? { status: 503, json: { message: "Unavailable" } }
        : { json: { data: latest.scan } },
    );
  });
  const open = async () => {
    await login(page, "admin_demo");
    await page.goto(`${origin}/staff/jobs/91`);
    await expect(
      page.getByRole("heading", { name: "Nội dung gửi duyệt", exact: true }),
    ).toBeVisible();
  };
  return { api, latest, open };
}

function completedScan(review: Awaited<ReturnType<typeof staffJobApi>>["review"]) {
  return {
    scanId: 128,
    revisionId: review.id,
    revisionVersion: review.revisionVersion,
    status: "COMPLETED",
    mode: "crawler",
    outdated: false,
    failureCode: null,
    analysisText: review.content.description,
    profile: "test",
    legalSnapshot: "test",
    asOfDate: "2026-11-01",
    createdAt: "2026-11-01T00:00:00Z",
    report: {
      schemaVersion: "1",
      mode: "crawler",
      profile: "test",
      legalSnapshot: "test",
      asOfDate: "2026-11-01",
      outcome: "NEEDS_REVIEW",
      warnings: [],
      usage: { available: false },
      findings: [
        {
          spanText: "Kiểm tra chứng từ",
          start: 0,
          end: 16,
          riskType: "test",
          severity: "medium",
          verdict: "NEEDS_REVIEW",
          explanation: "Cần đối chiếu ngữ cảnh của mô tả trước khi đưa ra quyết định.",
          citations: [
            {
              nodeId: "test-article",
              label: "Điều khoản đối chiếu",
              documentNumber: "Dữ liệu kiểm thử",
              quote: "Trích dẫn minh họa cho kiểm thử giao diện.",
              quoteGrounded: true,
              effectiveStatus: "ACTIVE",
              applicability: "UNVERIFIED",
            },
          ],
        },
      ],
    },
  };
}

test("analysis loads automatically for the viewed revision, survives refresh and annotates current content", async ({
  page,
}, info) => {
  const { api, latest, open } = await prepareDetail(page);
  latest.scan = completedScan(api.review);
  await open();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Mã phân tích", exact: true })).toHaveCount(0);
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
  const description = page.locator(".jp-content-view > section").filter({
    has: page.getByRole("heading", { name: "Mô tả công việc", exact: true }),
  });
  await expect(description.locator(".staff-job-legal-review")).toHaveCount(1);
  await expect(description.locator(".jp-inline-passage")).toContainText(
    latest.scan.report.findings[0].explanation,
  );
  await page.screenshot({
    path: info.outputPath("combined-inline-ai-desktop.png"),
    animations: "disabled",
  });
  await page.locator(".staff-ai-report > summary").click();
  await expect(page.locator(".jp-scan-finding")).toContainText(
    latest.scan.report.findings[0].explanation,
  );
  await page.locator(".jp-scan-citation summary").click();
  await expect(
    page
      .locator(".jp-scan-citation")
      .getByText("Cần xác minh hiệu lực điều khoản", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("analysis-result-desktop.png"),
    animations: "disabled",
  });
  await page.reload();
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
  expect(latest.reads).toBeGreaterThan(1);
  // A moderation state change advances the locking version without changing analyzed content.
  api.review.revisionVersion++;
  await page.getByRole("button", { name: "Tải lại bản tin", exact: true }).click();
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
  latest.scan.outdated = true;
  await page.getByRole("button", { name: "Tải lại phân tích", exact: true }).click();
  await expect(page.locator(".staff-known-scan > .jp-warning")).toBeVisible();
  await expect(page.locator(".staff-jobs-content .jp-inline-mark")).toHaveCount(0);
  await page.getByRole("button", { name: "Phê duyệt phiên bản", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("missing analysis and retrieval errors stay distinct, and processing results poll automatically", async ({
  page,
}, info) => {
  const { api, latest, open } = await prepareDetail(page);
  await open();
  await expect(
    page.getByText("Phiên bản này chưa có kết quả phân tích AI.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath("content-desktop.png"), animations: "disabled" });
  latest.fail = true;
  await page.getByRole("button", { name: "Tải lại phân tích", exact: true }).click();
  await expect(page.locator(".staff-known-scan [role='alert']")).toBeVisible();
  latest.fail = false;
  const completed = completedScan(api.review);
  latest.scan = { ...completed, status: "RUNNING", report: null } as unknown as typeof completed;
  await page.route("**/api/staff/job-revisions/91/scans/128", (route) =>
    route.fulfill({ json: { data: completed } }),
  );
  await page.getByRole("button", { name: "Tải lại phân tích", exact: true }).click();
  await expect(page.locator(".jp-scan-status")).toContainText("Đang phân tích");
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
});

test("switching JD versions loads only that revision's own analysis", async ({ page }) => {
  const { api, latest, open } = await prepareDetail(page);
  const previous = {
    ...api.review,
    id: 90,
    revisionNumber: 1,
    content: { ...api.review.content, description: "Nội dung cũ của công việc." },
  };
  const scan = completedScan(previous);
  scan.scanId = 127;
  scan.report.findings[0].spanText = "Nội dung cũ";
  await page.route("**/api/staff/job-revisions/90", (route) =>
    route.fulfill({ json: { data: previous } }),
  );
  await page.route("**/api/staff/job-revisions/90/scans/latest?*", (route) =>
    route.fulfill({ json: { data: scan } }),
  );
  await page.route("**/api/staff/jobs/83/revisions?*", (route) =>
    route.fulfill({
      json: {
        data: {
          content: [api.review, previous],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 2,
          totalPages: 1,
        },
      },
    }),
  );
  latest.scan = completedScan(api.review);
  await open();
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
  await page.getByRole("button", { name: "Xem phiên bản 1", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/jobs\/90$/);
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Nội dung cũ"]);
  await expect(page.locator(".staff-jobs-content")).not.toContainText("Kiểm tra chứng từ");
});

test("AI evidence sits directly beneath each highlighted passage inside the description", async ({
  page,
}, info) => {
  const { api, latest, open } = await prepareDetail(page);
  const first = "Kiểm tra chứng từ và lập báo cáo tài chính.";
  const second = "Phối hợp cùng bộ phận vận hành.";
  api.review.content.description = `${first}\n\n${second}`;
  latest.scan = completedScan(api.review);
  const base = latest.scan.report.findings[0];
  latest.scan.report.findings = [first, second].map((spanText, index) => ({
    ...base,
    spanText,
    start: index ? first.length + 2 : 0,
    end: index ? first.length + 2 + second.length : first.length,
    explanation: `Cần đối chiếu nội dung ${index + 1} với ngữ cảnh và căn cứ pháp luật.`,
  }));
  await open();
  const description = page.locator(".jp-content-view > section").filter({
    has: page.getByRole("heading", { name: "Mô tả công việc", exact: true }),
  });
  const passages = description.locator(".jp-inline-passage");
  await expect(passages).toHaveCount(2);
  for (const [index, text] of [first, second].entries()) {
    const passage = passages.nth(index);
    await expect(passage.locator("mark")).toHaveText(text);
    await expect(passage.locator(".jp-inline-finding-explanation")).toHaveText(
      latest.scan.report.findings[index].explanation,
    );
    const highlighted = (await passage.locator(".jp-inline-passage-text").boundingBox())!;
    const evidence = (await passage.locator(".jp-inline-findings").boundingBox())!;
    expect(evidence.y).toBeGreaterThanOrEqual(highlighted.y + highlighted.height);
    expect(evidence.y - highlighted.y - highlighted.height).toBeLessThanOrEqual(24);
  }
  await expect(description.locator(".staff-ai-report")).not.toHaveAttribute("open");
  await expect(description.locator(".jp-scan-finding:visible")).toHaveCount(0);
  await passages.first().locator(".jp-inline-finding > summary").press("Enter");
  await expect(passages.first().locator(".jp-inline-finding-explanation")).toBeHidden();
  await expect(passages.last().locator(".jp-inline-finding-explanation")).toBeVisible();
  await passages.first().locator(".jp-inline-finding > summary").press("Enter");
  await expect(passages.first().locator(".jp-inline-finding-explanation")).toBeVisible();
  await description.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: info.outputPath("inline-passages-desktop.png"),
    animations: "disabled",
  });
});
