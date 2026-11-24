import { test, expect, login } from "./fixtures";

const finding = {
  spanText: "Giữ bản chính CCCD.",
  start: 0,
  end: 19,
  riskType: "DOCUMENT_RETENTION",
  severity: "high",
  verdict: "NEEDS_REVIEW",
  explanation: "Ứng viên cần đối chiếu điều khoản giữ giấy tờ với quy định được trích dẫn.",
  citations: [
    {
      nodeId: "test:article:17",
      label: "Điều 17",
      documentNumber: "45/2019/QH14",
      quote: "Giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động.",
      quoteGrounded: true,
      effectiveStatus: "UNVERIFIED",
      applicability: "UNVERIFIED",
    },
  ],
};
const analysis = {
  mode: "crawler",
  outdated: false,
  asOfDate: "2026-11-22",
  completedAt: "2026-11-22T01:00:00Z",
  analysisText: "description:\nGiữ bản chính CCCD.\n\nLàm việc tại văn phòng.",
  report: {
    schemaVersion: "1",
    outcome: "NEEDS_REVIEW",
    findings: [finding],
    warnings: ["Kết quả cần được đối chiếu với văn bản gốc."],
  },
};
const detail = {
  id: 42,
  company: { id: 1, name: "Công ty thử nghiệm" },
  publicationStatus: "PUBLISHED",
  content: {
    title: "Nhân viên vận hành",
    description: "Giữ bản chính CCCD.\n\nLàm việc tại văn phòng.",
    location: "Hồ Chí Minh",
    employmentType: "FULL_TIME",
    workArrangement: "ONSITE",
    deadline: "2099-12-01T12:00:00+07:00",
  },
  aiAnalysis: analysis,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/candidate/applications?*", (route) =>
    route.fulfill({ json: { data: { content: [], totalElements: 0, totalPages: 0 } } }),
  );
});

test("candidate reads published AI findings and citations beside the JD", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await page.route("**/api/jobs/42", (route) => route.fulfill({ json: { data: detail } }));
  await page.goto("/can/jobs?job=42");
  await expect(
    page.getByRole("heading", { name: detail.content.title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Phân tích JD bằng AI", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".jp-inline-mark")).toHaveText(finding.spanText);
  const result = page.locator(".jp-inline-finding");
  await expect(result).toContainText(finding.explanation);
  await expect(result).toContainText(finding.citations[0].quote);
  await expect(result).toContainText("Cần xác minh hiệu lực điều khoản");
  await expect(page.getByText(analysis.report.warnings[0], { exact: true })).toBeVisible();
  await result.locator(":scope > summary").click();
  await expect(result.locator(".jp-inline-finding-body")).toBeHidden();
  await result.locator(":scope > summary").press("Enter");
  await expect(result.locator(".jp-inline-finding-body")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kiểm tra nội dung với AI" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({
    path: info.outputPath("candidate-job-analysis-desktop.png"),
    fullPage: true,
  });
});

test("missing analysis keeps the published JD and application link available", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({ json: { data: { ...detail, aiAnalysis: null } } }),
  );
  await page.goto("/can/jobs?job=42");
  await expect(
    page.getByText("Chưa có kết quả phân tích AI cho nội dung đang công bố."),
  ).toBeVisible();
  await expect(page.getByText(detail.content.description, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toBeVisible();
  await expect(page.locator(".jp-inline-mark")).toHaveCount(0);
});

test("older reports stay readable with a clear warning and stub reports never claim AI findings", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  let stub = false;
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({
      json: {
        data: {
          ...detail,
          aiAnalysis: { ...analysis, outdated: true, mode: stub ? "stub" : "crawler" },
        },
      },
    }),
  );
  await page.goto("/can/jobs?job=42");
  await expect(page.getByText(/Kết quả thuộc ngày hoặc dữ liệu phân tích trước đó/)).toBeVisible();
  await expect(page.locator(".jp-inline-finding")).toContainText(finding.explanation);
  stub = true;
  await page.reload();
  await expect(page.getByText("Chế độ thử nghiệm — chưa thực hiện phân tích AI.")).toBeVisible();
  await expect(page.locator(".jp-inline-mark, .jp-inline-finding")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toBeVisible();
});

test("reports retain findings outside unique description passages", async ({ page }) => {
  const unmatched = {
    ...finding,
    spanText: "Lương: 5 triệu",
    explanation: "Đối chiếu thông tin lương.",
  };
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({
      json: {
        data: {
          ...detail,
          aiAnalysis: { ...analysis, report: { ...analysis.report, findings: [unmatched] } },
        },
      },
    }),
  );
  await page.goto("/jobs?job=42");
  await expect(page.locator(".jp-inline-mark")).toHaveCount(0);
  await page.getByText("Xem toàn bộ 1 phát hiện", { exact: true }).click();
  await expect(page.locator(".public-job-analysis__report")).toContainText(unmatched.explanation);
  await expect(page.locator(".public-job-analysis__report")).toContainText(unmatched.spanText);
});

test("zero findings remain advisory and a revoked job removes its analysis", async ({ page }) => {
  let suspended = false;
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill(
      suspended
        ? { status: 404, json: { message: "Unavailable" } }
        : {
            json: {
              data: {
                ...detail,
                aiAnalysis: {
                  ...analysis,
                  report: { ...analysis.report, findings: [], outcome: "NO_RISKS_DETECTED" },
                },
              },
            },
          },
    ),
  );
  await page.goto("/jobs?job=42");
  await expect(
    page.getByText("Chưa phát hiện rủi ro trong phạm vi kiểm tra · 0 phát hiện"),
  ).toBeVisible();
  await expect(
    page.getByText("Kết quả AI chỉ mang tính tham khảo, không xác nhận tuân thủ pháp luật."),
  ).toBeVisible();
  suspended = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".public-job-analysis")).toHaveCount(0, { timeout: 15000 });
});

test("a malformed optional report keeps job content and applying available", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({
      json: {
        data: {
          ...detail,
          aiAnalysis: { ...analysis, report: { ...analysis.report, findings: [null] } },
        },
      },
    }),
  );
  await page.goto("/can/jobs?job=42");
  await expect(page.getByRole("alert")).toContainText("Chưa thể tải kết quả phân tích AI");
  await expect(page.getByText(detail.content.description, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ứng tuyển ngay", exact: true })).toBeVisible();
  await expect(page.locator(".jp-inline-mark, .jp-inline-finding")).toHaveCount(0);
});
