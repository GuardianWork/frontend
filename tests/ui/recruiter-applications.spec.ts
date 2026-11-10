import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
import type {
  ApplicationDetail,
  ApplicationStatus,
  StatusChange,
} from "../../src/services/recruiterApplications";

const stamp = "2026-11-01T08:30:00Z";
function applicant(
  id: string,
  candidateName: string,
  status: ApplicationStatus = "SUBMITTED",
): ApplicationDetail {
  return {
    id,
    candidateName,
    status,
    jobId: 42,
    jobTitle: "Chuyên viên kinh doanh",
    companyName: "Công ty Alpha",
    version: 0,
    appliedAt: stamp,
    email: "mai@example.test",
    phoneNumber: "0901234567",
    coverLetter: "Tôi mong muốn đóng góp kinh nghiệm phát triển khách hàng cho công ty.",
    cvFileName: "Nguyen-Thi-Mai.pdf",
    cvContentType: "application/pdf",
    cvFileSize: 2048,
    candidateFeedback: null,
    history: [
      {
        fromStatus: null,
        toStatus: status,
        actorUserId: 1,
        actorName: "Lê Thảo",
        occurredAt: stamp,
        rejectionReason: null,
        internalExplanation: null,
        candidateFeedback: null,
      },
    ],
  };
}
async function setup(page: Page, inbox = false) {
  const rows = [
    applicant("a1", "Nguyễn Thị Mai"),
    applicant("a2", "Trần Minh Anh", "UNDER_REVIEW"),
    applicant("a3", "Lê Văn Hùng", "SHORTLISTED"),
    applicant("a4", "Phạm Thu Hà", "REJECTED"),
    applicant("a5", "Võ Minh Đức", "WITHDRAWN"),
  ];
  if (inbox) Object.assign(rows[1], { jobId: 77, jobTitle: "Kỹ sư phần mềm" });
  const writes: StatusChange[] = [];
  let conflict = false;
  let forbidden = false;
  let pdfReads = 0;
  const filters: string[] = [];
  await page.route(/\/api\/companies\/me\/jobs\/(42|77)$/, (route) =>
    route.fulfill({
      json: {
        data: {
          id: Number(new URL(route.request().url()).pathname.split("/").at(-1)),
          status: "PUBLISHED",
        },
      },
    }),
  );
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 101,
          name: "Công ty Alpha",
          taxCode: "0101234567",
          verificationStatus: "VERIFIED",
          version: 1,
        },
      },
    }),
  );
  await page.route(
    /\/api\/companies\/me\/(?:applications(?:\?|$)|jobs\/(?:42|77)\/)/,
    async (route) => {
      const request = route.request();
      expect(request.headers().authorization).toMatch(/^Bearer /);
      const url = new URL(request.url());
      const reply = (data: unknown, status = 200) =>
        route.fulfill({ status, json: { status, data } });
      if (forbidden) return reply(null, 403);
      if (url.pathname.endsWith("/applications")) {
        const status = url.searchParams.get("status");
        filters.push(status || "");
        const name = url.searchParams.get("search") || "";
        const content = rows.filter(
          (r) =>
            (!status || r.status === status) &&
            (!name || r.candidateName.includes(name)) &&
            (!url.searchParams.has("jobId") || r.jobId === Number(url.searchParams.get("jobId"))),
        );
        return reply({
          content,
          pageNumber: 0,
          pageSize: 20,
          totalElements: content.length,
          totalPages: content.length ? 1 : 0,
          first: true,
          last: true,
        });
      }
      if (url.pathname.endsWith("/revisions/latest"))
        return reply({
          id: 1,
          revisionNumber: 1,
          state: "APPROVED",
          version: 1,
          content: { title: "Chuyên viên kinh doanh" },
        });
      const row = rows.find((row) => url.pathname.includes(`/applications/${row.id}`));
      if (!row) return reply(null, 404);
      if (url.pathname.endsWith("/cv")) {
        pdfReads++;
        return route.fulfill({
          contentType: "application/pdf",
          body: "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0/Kids[]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
        });
      }
      if (request.method() === "PATCH") {
        const body = request.postDataJSON() as StatusChange;
        writes.push(body);
        if (conflict) {
          row.status = "WITHDRAWN";
          row.version++;
          conflict = false;
          return reply(null, 409);
        }
        expect(body.version).toBe(row.version);
        const fromStatus = row.status;
        row.status = body.status;
        row.version++;
        row.history.push({
          fromStatus,
          toStatus: row.status,
          actorUserId: 3,
          actorName: "Nguyễn Minh Anh",
          occurredAt: "2026-11-05T10:00:00Z",
          rejectionReason: body.status === "REJECTED" ? body.rejectionReason : null,
          internalExplanation: body.status === "REJECTED" ? body.internalExplanation || null : null,
          candidateFeedback: body.status === "REJECTED" ? body.candidateFeedback || null : null,
        });
      }
      // Deliberately send stale personal evidence on final states to test client redaction.
      return reply(row);
    },
  );
  await login(page, "owner_demo", true);
  await page.goto(inbox ? "/rec/applications" : "/rec/applications?jobId=42");
  await expect(page.getByRole("link", { name: "Nguyễn Thị Mai Xem hồ sơ" })).toBeVisible();
  return {
    writes,
    filters,
    conflict: () => {
      conflict = true;
    },
    forbid: () => {
      forbidden = true;
    },
    pdfReads: () => pdfReads,
  };
}
async function openMai(page: Page) {
  await page.getByRole("link", { name: "Nguyễn Thị Mai Xem hồ sơ" }).click();
  await expect(page.getByRole("article", { name: "Chi tiết đơn ứng tuyển" })).toBeVisible();
  await expect(page.getByText("mai@example.test", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/rec\/applications\/42\/a1/);
  await expect(page.locator(".application-results")).toHaveCount(0);
}

async function choosePageStatus(page: Page, label: string) {
  await page
    .getByRole("article")
    .getByRole("button", { name: /Cập nhật trạng thái của/ })
    .click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test("filters all five stages and opens a dedicated submitted snapshot without changing its status", async ({
  page,
}) => {
  const api = await setup(page);
  await page.getByRole("button", { name: "Đang xem xét", exact: true }).click();
  await expect(page.getByRole("link", { name: "Trần Minh Anh Xem hồ sơ" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Nguyễn Thị Mai Xem hồ sơ" })).toHaveCount(0);
  expect(api.filters).toContain("UNDER_REVIEW");
  await page.getByRole("button", { name: "Tất cả", exact: true }).click();
  await openMai(page);
  expect(api.writes).toEqual([]);
  await expect(page.getByRole("heading", { name: "Lịch sử trạng thái" })).toBeVisible();
  await page.screenshot({ path: "/tmp/recruiter-applications-review.png", fullPage: true });
  await page.locator(".application-review-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.locator(".workspace-content > main").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.screenshot({ path: "/tmp/recruiter-applications-evidence.png" });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > innerWidth ||
      document.querySelector("main")!.scrollWidth > document.querySelector("main")!.clientWidth,
  );
  expect(overflow).toBe(false);
  await page.getByRole("link", { name: "Quay lại danh sách đơn ứng tuyển" }).click();
  await expect(page).toHaveURL(/\/rec\/applications\?jobId=42$/);
  await expect(page.getByRole("link", { name: "Nguyễn Thị Mai Xem hồ sơ" })).toBeVisible();
});

test("advances stages with fresh versions", async ({ page }) => {
  const api = await setup(page);
  await openMai(page);
  const detail = page.getByRole("article", { name: "Chi tiết đơn ứng tuyển" });
  await detail.getByRole("button", { name: /Cập nhật trạng thái của/ }).click();
  await expect(page.getByRole("menu")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: ".impeccable/review/recruiter-actor-names/page-status-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("menuitem", { name: "Đang xem xét", exact: true }).click();
  await expect(detail.locator(".application-notice")).toContainText("Đã cập nhật: Đang xem xét");
  await choosePageStatus(page, "Tiềm năng");
  await expect(detail.locator(".application-notice")).toContainText("Đã cập nhật: Tiềm năng");
  expect(api.writes).toEqual([
    { status: "UNDER_REVIEW", version: 0 },
    { status: "SHORTLISTED", version: 1 },
  ]);
  const history = detail.locator(".application-history");
  await expect(history).toContainText("Nguyễn Minh Anh");
  await expect(history).toContainText("Lê Thảo");
  await expect(history).not.toContainText("Người thực hiện #");
  await detail.getByRole("button", { name: /Cập nhật trạng thái của/ }).click();
  await expect(page.getByRole("menuitem", { name: "Đang xem xét", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.locator(".workspace-content > main").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await history.getByRole("heading", { name: "Lịch sử trạng thái" }).click();
  await page.screenshot({
    path: ".impeccable/review/recruiter-actor-names/history-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("rejects with private reason and separate candidate feedback, then removes personal evidence", async ({
  page,
}) => {
  const api = await setup(page);
  await openMai(page);
  await choosePageStatus(page, "Từ chối");
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await dialog.getByLabel("Lý do nội bộ", { exact: false }).selectOption("OTHER");
  await expect(dialog.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await dialog
    .getByLabel("Giải thích nội bộ", { exact: false })
    .fill("Lý do riêng của doanh nghiệp");
  await dialog
    .getByLabel("Phản hồi cho ứng viên", { exact: false })
    .fill("Cảm ơn bạn đã quan tâm.");
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "/tmp/recruiter-application-rejection.png" });
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(dialog).toHaveCount(0);
  expect(api.writes[0]).toEqual({
    status: "REJECTED",
    version: 0,
    rejectionReason: "OTHER",
    internalExplanation: "Lý do riêng của doanh nghiệp",
    candidateFeedback: "Cảm ơn bạn đã quan tâm.",
  });
  await expect(page.getByText("mai@example.test", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xem CV PDF" })).toHaveCount(0);
  await expect(page.getByText("Không thể thay đổi trạng thái.", { exact: false })).toBeVisible();
  await expect(page.getByText("Lý do riêng của doanh nghiệp", { exact: false })).toBeVisible();
  await page.locator(".application-review-body").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.locator(".workspace-content > main").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await page.screenshot({ path: "/tmp/recruiter-applications-terminal.png" });
});

test("version conflict blocks stale writes until refresh reveals withdrawal", async ({ page }) => {
  const api = await setup(page);
  await openMai(page);
  api.conflict();
  await choosePageStatus(page, "Tiềm năng");
  await expect(page.getByText("Đơn ứng tuyển đã thay đổi.", { exact: false })).toBeVisible();
  await expect(
    page
      .getByRole("article", { name: "Chi tiết đơn ứng tuyển" })
      .getByRole("button", { name: "Từ chối", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("mai@example.test", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tải lại hồ sơ" }).click();
  await expect(page.getByText("Ứng viên đã rút đơn.", { exact: false })).toBeVisible();
  await expect(page.getByText("mai@example.test", { exact: true })).toHaveCount(0);
  expect(api.writes).toHaveLength(1);
});

test("loads PDF only on request and clears evidence after access loss", async ({ page }) => {
  const api = await setup(page);
  await openMai(page);
  expect(api.pdfReads()).toBe(0);
  await page.getByRole("button", { name: "Xem CV PDF" }).click();
  await expect(page.locator("iframe.application-pdf")).toHaveAttribute("src", /^blob:/);
  expect(api.pdfReads()).toBe(1);
  await page
    .getByRole("article")
    .getByRole("button", { name: /Cập nhật trạng thái của/ })
    .click();
  await expect(page.getByRole("menuitem", { name: "Đang xem xét", exact: true })).toBeVisible();
  api.forbid();
  await page.getByRole("menuitem", { name: "Đang xem xét", exact: true }).press("Enter");
  await expect(
    page.getByText("Hồ sơ không còn khả dụng hoặc bạn không còn quyền truy cập.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("iframe.application-pdf")).toHaveCount(0);
  await expect(page.getByText("mai@example.test", { exact: true })).toHaveCount(0);
});

test("opens the inbox across assigned jobs and navigates using each row's job id", async ({
  page,
}) => {
  const api = await setup(page, true);
  await expect(page.getByText("Chọn tin tuyển dụng để xem đơn ứng tuyển")).toHaveCount(0);
  await expect(page.locator(".application-job-title", { hasText: "Kỹ sư phần mềm" })).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/recruiter-dedicated/list-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  const detailRequest = page.waitForRequest((r) => r.url().endsWith("/jobs/77/applications/a2"));
  await page.getByRole("link", { name: "Trần Minh Anh Xem hồ sơ" }).click();
  await detailRequest;
  const detail = page.getByRole("article", { name: "Chi tiết đơn ứng tuyển" });
  await expect(detail.getByText("Kỹ sư phần mềm", { exact: true })).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/recruiter-dedicated/detail-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await choosePageStatus(page, "Tiềm năng");
  await expect(detail.locator(".application-notice")).toContainText("Tiềm năng");
  expect(api.writes).toEqual([{ status: "SHORTLISTED", version: 0 }]);
  await page.getByRole("link", { name: "Quay lại danh sách đơn ứng tuyển" }).click();
  await expect(page.locator("tr", { hasText: "Trần Minh Anh" })).toContainText("Tiềm năng");
  await page.getByRole("searchbox").fill("Không có ứng viên");
  await expect(
    page.getByRole("heading", { name: "Không tìm thấy ứng viên phù hợp" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(page.getByRole("link", { name: "Nguyễn Thị Mai Xem hồ sơ" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("inbox handles empty pages, retryable failures and server pagination", async ({ page }) => {
  await setup(page, true);
  let mode: "empty" | "error" | "pages" = "empty";
  await page.route("**/api/companies/me/applications?**", async (route) => {
    if (mode === "error") return route.fulfill({ status: 503, json: { status: 503, data: null } });
    const index = Number(new URL(route.request().url()).searchParams.get("page"));
    const content =
      mode === "empty" ? [] : [applicant(`page-${index}`, `Ứng viên trang ${index + 1}`)];
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content,
          pageNumber: index,
          pageSize: 20,
          totalElements: mode === "empty" ? 0 : 21,
          totalPages: mode === "empty" ? 0 : 2,
          first: index === 0,
          last: mode === "empty" || index === 1,
        },
      },
    });
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Chưa có đơn ứng tuyển" })).toBeVisible();
  mode = "error";
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Không thể tải đơn ứng tuyển. Vui lòng thử lại." }),
  ).toBeVisible();
  mode = "pages";
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByRole("link", { name: "Ứng viên trang 1 Xem hồ sơ" })).toBeVisible();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ứng viên trang 2 Xem hồ sơ" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Đơn ứng tuyển", exact: true })).toBeFocused();
});

test("row status menu advances with a fresh version and confirms rejection without opening details", async ({
  page,
}) => {
  const api = await setup(page, true);
  const row = page.locator("tr", { hasText: "Nguyễn Thị Mai" });
  const trigger = row.getByRole("button", { name: "Cập nhật trạng thái của Nguyễn Thị Mai" });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem", { name: "Đang xem xét", exact: true })).toBeVisible();
  await expect(menu).toHaveCSS("opacity", "1");
  await expect(menu).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.screenshot({
    path: ".impeccable/review/recruiter-dedicated/status-menu-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await menu.getByRole("menuitem", { name: "Đang xem xét", exact: true }).click();
  await expect(row).toContainText("Đang xem xét");
  await expect(page).toHaveURL(/\/rec\/applications$/);
  expect(api.writes).toEqual([{ status: "UNDER_REVIEW", version: 0 }]);
  await trigger.click();
  await page.getByRole("menuitem", { name: "Từ chối", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Từ chối", exact: true }).click();
  await expect(dialog).toBeVisible();
  expect(api.writes).toHaveLength(1);
  await dialog.getByLabel("Lý do nội bộ", { exact: false }).selectOption("POSITION_FILLED");
  await dialog.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(row).toContainText("Đã từ chối");
  expect(api.writes[1]).toEqual({
    status: "REJECTED",
    version: 1,
    rejectionReason: "POSITION_FILLED",
  });
  await trigger.click();
  await expect(page.getByRole("menu")).toContainText("Đơn ứng tuyển đã kết thúc");
  await expect(page.getByRole("menuitem", { name: "Từ chối", exact: true })).toHaveCount(0);
});

test("row status conflict requires refreshing before another change", async ({ page }) => {
  const api = await setup(page, true);
  await page.getByRole("button", { name: "Cập nhật trạng thái của Nguyễn Thị Mai" }).click();
  api.conflict();
  await page.getByRole("menuitem", { name: "Tiềm năng", exact: true }).click();
  // Inbox refetch may close the row menu; reopening must read the changed terminal state.
  await page.getByRole("button", { name: "Cập nhật trạng thái của Nguyễn Thị Mai" }).click();
  await expect(page.getByRole("menu")).toContainText("Đơn ứng tuyển đã kết thúc");
  expect(api.writes).toHaveLength(1);
});

test("dedicated application page supports direct access and refresh", async ({ page }) => {
  await setup(page);
  await page.goto("/rec/applications/42/a1?fromJobId=42");
  await expect(page.getByRole("heading", { name: "Nguyễn Thị Mai", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("mai@example.test", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Chi tiết đơn ứng tuyển", exact: true }),
  ).toBeFocused();
  await page.getByRole("link", { name: "Quay lại danh sách đơn ứng tuyển" }).click();
  await expect(page).toHaveURL(/\/rec\/applications\?jobId=42$/);
});

test("history without a display name uses a neutral label instead of a database ID", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/companies/me/jobs/42/applications/a1", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          ...applicant("a1", "Nguyễn Thị Mai"),
          history: [
            {
              ...applicant("a1", "Nguyễn Thị Mai").history[0],
              actorName: null,
              actorUserId: 876543,
            },
            { ...applicant("a1", "Nguyễn Thị Mai").history[0], actorName: "  ", actorUserId: null },
          ],
        },
      },
    }),
  );
  await openMai(page);
  await expect(page.locator(".application-history")).toContainText(
    "Người thực hiện: Chưa có thông tin",
  );
  await expect(page.locator(".application-history")).not.toContainText("876543");
});

test("interview progression and confirmed hiring retain evidence and end processing", async ({
  page,
}) => {
  const api = await setup(page);
  await openMai(page);
  const trigger = page.getByRole("button", { name: "Cập nhật trạng thái của Nguyễn Thị Mai" });
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: "Phỏng vấn", exact: true })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Nhận việc…" })).toHaveCount(0);
  await page.getByRole("menuitem", { name: "Đang xem xét", exact: true }).click();
  await trigger.click();
  await page.getByRole("menuitem", { name: "Phỏng vấn", exact: true }).click();
  await expect(page.locator(".application-notice").last()).toContainText("ngoài GuardianWork");
  await trigger.click();
  await page.getByRole("menuitem", { name: "Nhận việc…" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận đã tuyển", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: ".impeccable/review/lifecycle/hiring-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(api.writes).toHaveLength(2);
  await trigger.click();
  await page.getByRole("menuitem", { name: "Nhận việc…" }).click();
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Xác nhận đã tuyển", exact: true }).click();
  await expect
    .poll(() => api.writes[2])
    .toEqual({ status: "HIRED", version: 2, hiringConfirmed: true });
  await expect(page.getByText("mai@example.test", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem CV PDF", exact: true })).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("menu")).toContainText("Đơn ứng tuyển đã kết thúc");
  await expect(page.getByRole("menuitem", { name: "Từ chối", exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await page.screenshot({
    path: ".impeccable/review/lifecycle/hired-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("background polling keeps the inbox and open status menu mounted", async ({ page }) => {
  await page.clock.install();
  await setup(page, true);
  const trigger = page.getByRole("button", { name: "Cập nhật trạng thái của Nguyễn Thị Mai" });
  await trigger.click();
  await expect(page.getByRole("menuitem", { name: "Đang xem xét", exact: true })).toBeVisible();
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let arrived = () => {};
  const requested = new Promise<void>((resolve) => {
    arrived = resolve;
  });
  await page.route("**/api/companies/me/applications?**", async (route) => {
    arrived();
    await held;
    await route.fallback();
  });
  try {
    await page.clock.fastForward(10_100);
    await requested;
    await expect(
      page.locator(".application-candidate").filter({ hasText: "Nguyễn Thị Mai" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Đang xem xét", exact: true })).toBeVisible();
    await expect(page.getByText("Đang tải đơn ứng tuyển…", { exact: true })).toHaveCount(0);
  } finally {
    release();
  }
});
