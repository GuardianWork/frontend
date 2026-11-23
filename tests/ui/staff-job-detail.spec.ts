import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

async function prepareDetail(page: import("@playwright/test").Page) {
  const api = await staffJobApi(page);
  const latest = { scan: null as ReturnType<typeof completedScan> | null, fail: false, reads: 0 };
  await page.route("**/api/jobs/83/revisions/91/scans", (route) => {
    latest.reads++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({
      expectedRevisionVersion: api.review.revisionVersion,
    });
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
    revisionId: review.id,
    revisionVersion: review.revisionVersion,
    status: "COMPLETED",
    mode: "crawler",
    outdated: false,
    analysisText: review.content.description,
    asOfDate: "2026-11-01",
    completedAt: "2026-11-01T00:00:00Z",
    report: {
      schemaVersion: "1",
      outcome: "NEEDS_REVIEW",
      warnings: [],
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

test("Staff requests the viewed revision explicitly and shows safe report text", async ({
  page,
}, info) => {
  const { api, latest, open } = await prepareDetail(page);
  latest.scan = completedScan(api.review);
  latest.scan.report.warnings = ["<img src=x onerror=alert(1)> Cần đối chiếu ngữ cảnh."];
  await open();
  expect(latest.reads).toBe(0);
  await page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }).click();
  await expect(page.locator(".staff-jobs-content mark")).toContainText(["Kiểm tra chứng từ"]);
  await page.locator(".staff-ai-report > summary").press("Enter");
  await expect(page.locator(".jp-scan-warnings")).toContainText("<img src=x onerror=alert(1)>");
  await expect(page.locator(".staff-known-scan img")).toHaveCount(0);
  await page.locator(".jp-scan-disclosure > summary").click();
  await expect(page.locator(".jp-scan-snapshot")).toContainText(api.review.content.description);
  await page.screenshot({ path: info.outputPath("post-analysis-desktop.png") });
  const reads = latest.reads;
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }),
  ).toBeVisible();
  expect(latest.reads).toBe(reads);
});

test("Staff uses the same POST to poll and stops at COMPLETED", async ({ page }) => {
  const { api, open } = await prepareDetail(page);
  let requests = 0;
  await page.route("**/api/jobs/83/revisions/91/scans", (route) => {
    requests++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ expectedRevisionVersion: 7 });
    const completed = completedScan(api.review);
    return route.fulfill({
      json: {
        data:
          requests === 1
            ? { ...completed, status: "QUEUED", report: null }
            : requests === 2
              ? { ...completed, status: "RUNNING", report: null }
              : completed,
      },
    });
  });
  await open();
  await page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }).click();
  await expect(page.locator(".jp-scan-status")).toContainText("Đang chờ phân tích");
  await expect(page.locator(".staff-ai-report")).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(2200);
  expect(requests).toBe(3);
});

for (const status of [400, 403, 404, 409, 503]) {
  test(`Staff stops polling on HTTP ${status} and reloads JD on conflict`, async ({ page }) => {
    const { api, open } = await prepareDetail(page);
    let requests = 0;
    await page.route("**/api/jobs/83/revisions/91/scans", (route) => {
      requests++;
      return route.fulfill({ status, json: { message: "unavailable" } });
    });
    await open();
    const loads = api.detailLoads;
    await page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }).click();
    if (status === 409) {
      await expect.poll(() => api.detailLoads).toBeGreaterThan(loads);
      await expect(
        page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }),
      ).toBeVisible();
    } else await expect(page.locator(".staff-known-scan [role=alert]")).toBeVisible();
    await page.waitForTimeout(2200);
    expect(requests).toBe(1);
    if (status === 409) expect(api.detailLoads).toBeGreaterThan(loads);
    await expect(page.locator(".jp-scan-result")).toHaveCount(0);
  });
}

test("Staff failure is terminal and a repeated request returns the same failed state", async ({
  page,
}) => {
  const { api, latest, open } = await prepareDetail(page);
  latest.scan = {
    ...completedScan(api.review),
    status: "FAILED",
    report: null,
  } as unknown as ReturnType<typeof completedScan>;
  await open();
  await page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }).click();
  await expect(page.locator(".jp-scan-status")).toContainText("Không thể hoàn tất");
  await page.waitForTimeout(2200);
  expect(latest.reads).toBe(1);
  await page.getByRole("button", { name: "Kiểm tra trạng thái phân tích", exact: true }).click();
  await expect.poll(() => latest.reads).toBe(2);
  await expect(page.locator(".staff-known-scan")).toContainText("trạng thái thất bại này");
});

test("Staff clears old annotations on version change and ignores a late scan response", async ({
  page,
}) => {
  const { api, open } = await prepareDetail(page);
  let release!: () => void;
  let started = false;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/jobs/83/revisions/91/scans", async (route) => {
    started = true;
    await pending;
    await route.fulfill({ json: { data: completedScan(api.review) } }).catch(() => {});
  });
  await open();
  await page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }).click();
  await expect.poll(() => started).toBe(true);
  api.review.revisionVersion++;
  await page.getByRole("button", { name: "Tải lại bản tin", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Phân tích JD bằng AI", exact: true }),
  ).toBeVisible();
  release();
  await expect(page.locator(".staff-jobs-content mark")).toHaveCount(0);
  await expect(page.locator(".staff-ai-report")).toHaveCount(0);
});
