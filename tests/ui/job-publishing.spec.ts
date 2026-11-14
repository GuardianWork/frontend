import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
import type { Job, JobContent, RevisionHistory } from "../../src/services/jobs";

const completeContent: JobContent = {
  title: "Chuyên viên kinh doanh",
  description:
    "Phát triển khách hàng doanh nghiệp.\n\nTrách nhiệm\nTư vấn và theo dõi hợp đồng.\n\nYêu cầu\nGiao tiếp rõ ràng.\n\nQuyền lợi\nBảo hiểm và đào tạo chuyên môn.",
  location: "Hà Nội",
  employmentType: "FULL_TIME",
  workArrangement: "ONSITE",
  deadline: "2099-12-01T10:00:00Z",
};
const stamp = "2026-10-27T01:00:00Z";
function makeJob(content: JobContent = completeContent): Job {
  return {
    applicationCount: 12,
    id: 83,
    companyId: 101,
    creatorUserId: 3,
    status: "DRAFT",
    version: 2,
    ownerResponsible: true,
    needsReassignment: false,
    workingRevision: {
      id: 91,
      revisionNumber: 1,
      state: "DRAFT",
      version: 3,
      content: structuredClone(content),
    },
    publishedRevisionId: null,
    approvedDeadline: null,
    assignments: [],
    availableActions: ["PREVIEW", "SAVE_DRAFT", "SUBMIT"],
    createdAt: stamp,
    updatedAt: stamp,
  };
}
function paged<T>(content: T[], page = 0, size = 20) {
  return {
    content: content.slice(page * size, (page + 1) * size),
    pageNumber: page,
    pageSize: size,
    totalElements: content.length,
    totalPages: Math.ceil(content.length / size),
    first: page === 0,
    last: (page + 1) * size >= content.length,
  };
}
async function mockJobs(page: Page, initial: Job[] = [makeJob()]) {
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 101,
          name: "Alpha",
          taxCode: "0101234567",
          verificationStatus: "VERIFIED",
          version: 1,
        },
      },
    }),
  );
  await page.route("**/api/companies/101", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 101,
          name: "Alpha",
          taxCode: "0101234567",
          verificationStatus: "VERIFIED",
          version: 1,
        },
      },
    }),
  );
  await page.route("**/api/companies/me", (route) =>
    route.fulfill({ json: { status: 200, data: { companyId: 101, companyRole: "RECRUITER" } } }),
  );
  const jobs = structuredClone(initial);
  let conflict = false;
  const writes: { path: string; method: string; body: Record<string, unknown> | null }[] = [];
  const histories = new Map<number, RevisionHistory[]>();
  for (const job of jobs)
    if (job.workingRevision)
      histories.set(job.id, [
        {
          ...structuredClone(job.workingRevision),
          createdAt: stamp,
          submittedAt: null,
          decidedAt: null,
          withdrawnAt: null,
          rejectionReason: null,
        },
      ]);
  await page.route("**/api/companies/me/members?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: paged([
          {
            membershipId: 7,
            userId: 2,
            firstName: "Linh",
            lastName: "Trần",
            email: "linh@example.test",
            companyRole: "RECRUITER",
            status: "ACTIVE",
            joinedAt: stamp,
          },
        ]),
      },
    }),
  );
  await page.route("**/api/companies/me/jobs**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    const body = request.postDataJSON() as Record<string, unknown> | null;
    const reply = (data: unknown, status = 200, message = "OK") =>
      route.fulfill({ status, json: { status, data, message } });
    if (method !== "GET") writes.push({ path, method, body });
    expect(request.headers().authorization).toMatch(/^Bearer /);
    if (path === "/api/companies/me/jobs") {
      if (method === "POST") {
        const job = makeJob(body!.content as JobContent);
        jobs.push(job);
        return reply(job, 201);
      }
      let filtered = jobs;
      if (url.searchParams.get("status"))
        filtered = filtered.filter((job) => job.status === url.searchParams.get("status"));
      if (url.searchParams.get("needsReassignment"))
        filtered = filtered.filter((job) => job.needsReassignment);
      return reply(paged(filtered, Number(url.searchParams.get("page") || 0)));
    }
    const id = Number(path.split("/")[5]);
    const job = jobs.find((job) => job.id === id);
    if (!job) return reply(null, 404, "NOT_FOUND");
    if (
      method !== "GET" &&
      (conflict ||
        (body?.expectedJobVersion ?? Number(url.searchParams.get("expectedJobVersion"))) !==
          job.version)
    )
      return reply(null, 409, "40022 CONCURRENT_MODIFICATION");
    if (path.endsWith("/draft/preview")) {
      const issues = [
        "title",
        "description",
        "location",
        "employmentType",
        "workArrangement",
        "deadline",
      ]
        .filter((key) => !job.workingRevision?.content[key as keyof JobContent])
        .map((field) => ({ field: `content.${field}`, code: "REQUIRED" }));
      if (job.needsReassignment)
        issues.push({ field: "responsibility", code: "RESPONSIBILITY_REQUIRED" });
      return reply({
        content: job.workingRevision!.content,
        jobVersion: job.version,
        revisionVersion: job.workingRevision!.version,
        submissionEligible: issues.length === 0,
        validationIssues: issues,
      });
    }
    if (method === "POST" && path.endsWith("/draft")) {
      const previous = histories.get(id)!.at(-1)!;
      job.workingRevision = {
        id: previous.id + 1,
        revisionNumber: previous.revisionNumber + 1,
        version: 0,
        state: "DRAFT",
        content: structuredClone(previous.content),
      };
      job.version++;
      job.availableActions = ["SAVE_DRAFT", "PREVIEW", "SUBMIT"];
    } else if (method === "PUT" && path.endsWith("/draft")) {
      expect(body!.expectedRevisionVersion).toBe(job.workingRevision!.version);
      job.workingRevision!.content = body!.content as JobContent;
      job.workingRevision!.version++;
      job.version++;
    } else if (path.endsWith("/submit")) {
      expect(body!.confirmed).toBe(true);
      expect(body!.expectedRevisionVersion).toBe(job.workingRevision!.version);
      job.workingRevision!.state = "PENDING_REVIEW";
      job.workingRevision!.version++;
      job.version++;
      job.availableActions = ["WITHDRAW"];
    } else if (path.endsWith("/withdraw")) {
      job.workingRevision = null;
      job.version++;
      job.availableActions = ["CREATE_DRAFT"];
    } else if (path.endsWith("/owner-responsibility")) {
      job.ownerResponsible = Boolean(body!.responsible);
      job.version++;
    } else if (path.includes("/assignments/")) {
      if (method === "PUT")
        job.assignments.push({
          id: 1,
          membershipId: 7,
          membershipJoinedAt: stamp,
          assignedAt: stamp,
        });
      else job.assignments = [];
      job.version++;
    } else if (path.endsWith("/pause")) {
      job.status = "PAUSED";
      job.availableActions = ["CREATE_DRAFT", "RESUME", "CLOSE"];
      job.version++;
    } else if (path.endsWith("/resume")) {
      job.status = "PUBLISHED";
      job.availableActions = ["CREATE_DRAFT", "PAUSE", "CLOSE"];
      job.version++;
    } else if (path.endsWith("/close")) {
      job.status = "CLOSED";
      job.availableActions = [];
      job.version++;
    } else if (path.endsWith("/revisions")) {
      if (job.workingRevision)
        histories.set(id, [
          {
            ...structuredClone(job.workingRevision),
            createdAt: stamp,
            submittedAt: job.workingRevision.state === "PENDING_REVIEW" ? stamp : null,
            decidedAt: null,
            withdrawnAt: null,
            rejectionReason: null,
          },
        ]);
      return reply(
        paged(
          histories.get(id) ?? [],
          Number(url.searchParams.get("page") || 0),
          Number(url.searchParams.get("size") || 20),
        ),
      );
    }
    job.needsReassignment = !job.ownerResponsible && !job.assignments.length;
    return reply(job);
  });
  return {
    writes,
    clearConflict: () => {
      conflict = false;
    },
    setConflict: () => {
      conflict = true;
    },
    getJobs: () => jobs,
    histories,
  };
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth + 1 ||
        document.querySelector("main")!.scrollWidth >
          document.querySelector("main")!.clientWidth + 1,
    ),
  ).toBe(false);
}

test("owner creates a guided draft, resumes progress, recovers failed save and submits the persisted revision", async ({
  page,
}, info) => {
  const mock = await mockJobs(page, []);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs");
  await expect(
    page.getByRole("heading", { name: "Bắt đầu với tin tuyển dụng đầu tiên" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Đăng tin tuyển dụng" }).first().click();
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Chuyên viên kinh doanh");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page).toHaveURL(/jobId=83/);
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Lưu và tiếp tục", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("cần bổ sung");
  await expect(page.getByRole("combobox", { name: "Loại công việc", exact: true })).toBeFocused();
  await expect(page.getByRole("combobox", { name: "Loại công việc", exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page
    .getByRole("textbox", { name: "Địa điểm làm việc", exact: true })
    .fill(completeContent.location!);
  await page
    .getByRole("combobox", { name: "Loại công việc", exact: true })
    .selectOption("FULL_TIME");
  await page
    .getByRole("combobox", { name: "Hình thức làm việc", exact: true })
    .selectOption("ONSITE");
  const deadline = page.getByLabel("Hạn ứng tuyển", { exact: true });
  await deadline.fill("2000-01-01");
  expect(await deadline.evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(
    true,
  );
  await deadline.fill("2099-12-01");
  await page.getByRole("button", { name: "Lưu và tiếp tục", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Lưu và tiếp tục", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toBeFocused();
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Mô tả công việc", exact: true })
    .fill(completeContent.description!);
  mock.setConflict();
  await page.getByRole("button", { name: "Lưu và tiếp tục", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Mô tả công việc", exact: true })).toHaveText(
    completeContent.description!.replace(/\n/g, ""),
  );
  mock.clearConflict();
  await page.getByRole("button", { name: "Lưu và tiếp tục", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bỏ qua và xem trước" })).toBeVisible();
  await expect(page.getByLabel("Trách nhiệm công việc", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Yêu cầu bắt buộc", { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: "/tmp/job-creation-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: `/tmp/job-publishing-${info.project.name}-editor.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByRole("button", { name: "Bỏ qua và xem trước" }).click();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeEnabled();
  await page.screenshot({
    path: `/tmp/job-publishing-${info.project.name}-preview.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Xác nhận gửi duyệt" }).click();
  await expect(page.getByText("Đã gửi bản tin để xét duyệt.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Rút bản gửi duyệt", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Bản v1 đang chờ duyệt", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Rút bản gửi duyệt", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận rút bản gửi" }).click();
  await expect(page.getByRole("button", { name: "Tạo bản chỉnh sửa" })).toBeVisible();
  const saved = mock.writes.findLast(
    (write) => write.method === "PUT" && write.path.endsWith("/draft"),
  );
  expect(Object.keys(saved!.body!.content as JobContent).sort()).toEqual(
    ["title", "description", "employmentType", "workArrangement", "location", "deadline"].sort(),
  );
});

test("a saved draft remains successful when the browser cannot store step progress", async ({
  page,
}) => {
  const mock = await mockJobs(page, []);
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?create=true");
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Chuyên viên vận hành");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("job-creation:"))
        throw new DOMException("Storage unavailable", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page).toHaveURL(/jobId=83/);
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(mock.writes.filter((write) => write.method === "POST")).toHaveLength(1);
  expect(mock.getJobs()[0].workingRevision?.content.title).toBe("Chuyên viên vận hành");
});

test("recruiter rail and forms stay usable at desktop, tablet and phone widths", async ({
  page,
}) => {
  test.setTimeout(90000);
  await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const nav = page.getByRole("navigation", { name: "Điều hướng nhà tuyển dụng", exact: true });
  await expect(page.locator("#recruiter-navigation")).toHaveCSS("width", "244px");
  await page.getByRole("button", { name: "Thu gọn thanh điều hướng", exact: true }).click();
  await expect(page.locator("#recruiter-navigation")).toHaveCSS("width", "76px");
  await page.getByRole("button", { name: "Mở rộng thanh điều hướng", exact: true }).click();
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    for (const route of [
      "/rec",
      "/rec/jobs",
      "/rec/applications",
      "/rec/talent",
      "/rec/verification",
      "/rec/members",
      "/rec/jobs?create=true",
    ]) {
      await page.goto(route);
      await expect(page.locator("main h1, main h2").first()).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await noOverflow(page);
      await page.screenshot({
        path: `.impeccable/review/indeed/${width}-${route.split("/").filter(Boolean).join("-").replace("?create=true", "-create")}.png`,
        fullPage: true,
      });
    }
  }
  const open = page.getByRole("button", { name: "Mở menu", exact: true });
  await open.click();
  await expect(nav).toBeVisible();
  await expect(page.locator(".workspace-content")).toHaveJSProperty("inert", true);
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
  await expect(open).toBeFocused();
  await expect(page.locator(".workspace-content")).toHaveJSProperty("inert", false);
});

test("assignment preserves typed content and stale edits never report success", async ({
  page,
}, info) => {
  const mock = await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Bản sửa chưa lưu");
  await page.getByLabel("Tôi chịu trách nhiệm với tư cách trưởng ban tuyển dụng").click();
  await expect(
    page.getByText("Chưa có người phụ trách. Cần phân công trước khi gửi duyệt.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Linh Trần").click();
  await expect(page.getByLabel("Linh Trần")).toBeChecked();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
    "Bản sửa chưa lưu",
  );
  await expect(
    page.getByText("Chưa có người phụ trách. Cần phân công trước khi gửi duyệt.", { exact: true }),
  ).toHaveCount(0);
  mock.setConflict();
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("đã được người khác cập nhật");
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
    "Bản sửa chưa lưu",
  );
  await page.screenshot({
    path: `/tmp/job-publishing-${info.project.name}-conflict.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Ở lại", exact: true }).click();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
    "Bản sửa chưa lưu",
  );
  await noOverflow(page);
});

test("list filters reach the API and publication controls require explicit closing confirmation", async ({
  page,
}, info) => {
  const job = makeJob();
  job.status = "PUBLISHED";
  job.publishedRevisionId = 91;
  job.approvedDeadline = completeContent.deadline!;
  job.workingRevision!.state = "APPROVED";
  const mock = await mockJobs(page, [
    job,
    { ...makeJob(), id: 84, needsReassignment: true, ownerResponsible: false },
  ]);
  job.workingRevision = null;
  mock.getJobs()[0].workingRevision = null;
  mock.getJobs()[0].availableActions = ["CREATE_DRAFT", "PAUSE", "CLOSE"];
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs");
  await expect(page.locator(".jp-job-list > li")).toHaveCount(2);
  await page.screenshot({
    path: `/tmp/job-publishing-${info.project.name}-list.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByLabel("Cần phân công lại", { exact: true }).check();
  await expect(page.locator(".jp-job-list > li")).toHaveCount(1);
  await page.getByLabel("Cần phân công lại", { exact: true }).uncheck();
  await page.getByLabel("Trạng thái xuất bản").selectOption("PUBLISHED");
  await expect(page.locator(".jp-job-list > li")).toHaveCount(1);
  await page.getByRole("link", { name: /^Quản lý Chuyên viên/ }).click();
  await page.getByRole("button", { name: "Bản đã duyệt", exact: true }).click();
  await expect(
    page.getByText("Đây là nội dung đang công khai cho ứng viên.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".jp-content-view")).toContainText(completeContent.description!);
  await page.getByRole("button", { name: "Tạm dừng tin", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tiếp tục đăng tin", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tiếp tục đăng tin", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạm dừng tin", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đóng tin tuyển dụng", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toContainText("không thể mở lại");
  await page.getByRole("button", { name: "Xác nhận đóng tin", exact: true }).click();
  await expect(page.getByText("Đã đóng tin tuyển dụng.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiếp tục đăng tin", exact: true })).toHaveCount(0);
});

test("assigned recruiter cannot change responsibility; request failure has a retry state", async ({
  page,
}) => {
  await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 3,
          username: "owner_demo",
          email: "owner@example.test",
          firstName: "Minh",
          lastName: "Lê",
          role: "USER",
          emailVerified: true,
          recruitingEmailEligible: true,
          activeMembership: {
            companyId: 101,
            companyName: "Alpha",
            companyRole: "RECRUITER",
            joinedAt: stamp,
          },
        },
      },
    }),
  );
  await page.goto("/rec/jobs?jobId=83");
  await expect(
    page.getByText("Chủ sở hữu công ty đang chịu trách nhiệm với tin này.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Tôi chịu trách nhiệm với tư cách trưởng ban tuyển dụng"),
  ).toHaveCount(0);
  await page.route("**/api/companies/me/jobs?**", (route) =>
    route.fulfill({ status: 503, json: { status: 503, message: "Unavailable", data: null } }),
  );
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await expect(page.getByRole("heading", { name: "Chưa tải được danh sách" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại", exact: true })).toBeVisible();
});

test("rejection reasons remain readable and a replacement draft starts from the rejected content", async ({
  page,
}) => {
  const seed = makeJob();
  const mock = await mockJobs(page, [seed]);
  const rejected = mock.histories.get(83)![0];
  rejected.state = "REJECTED";
  rejected.rejectionReason = "Vui lòng làm rõ quyền lợi của vị trí.";
  rejected.decidedAt = stamp;
  mock.getJobs()[0].workingRevision = null;
  mock.getJobs()[0].availableActions = ["CREATE_DRAFT"];
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await expect(
    page.getByRole("heading", { level: 1, name: completeContent.title!, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".jp-content-view")).toContainText(completeContent.description!);
  await page.getByRole("button", { name: "Lịch sử xét duyệt", exact: true }).click();
  await expect(page.getByText(rejected.rejectionReason, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Bản v1 · Chuyên viên kinh doanh", exact: true }).click();
  await expect(page.locator(".jp-history-content")).toContainText(completeContent.description!);
  await page.getByRole("button", { name: "Tạo bản chỉnh sửa", exact: true }).click();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
    completeContent.title!,
  );
  await expect(page.getByText("Bản nháp · v2", { exact: true })).toBeVisible();
});

test("expired jobs with unfinished revisions open in readable preview without an editor", async ({
  page,
}) => {
  const job = makeJob();
  job.status = "EXPIRED";
  job.availableActions = [];
  await mockJobs(page, [job]);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await expect(page.locator(".jp-content-view")).toBeVisible();
  await expect(page.getByText("Tin đã kết thúc.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveCount(0);
});

test("remote jobs keep multiline descriptions and optional values can be added then omitted", async ({
  page,
}) => {
  const mock = await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Hình thức làm việc", exact: true })
    .selectOption("REMOTE");
  await page.getByLabel("Khu vực có thể làm việc từ xa", { exact: true }).fill("Toàn thế giới");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await page.screenshot({ path: "/tmp/job-publishing-mobile-editor.png", fullPage: true });
  await page.getByLabel("Số lượng tuyển", { exact: true }).fill("2");
  await page.getByRole("combobox", { name: "Mức lương", exact: true }).selectOption("true");
  await page.getByLabel("Lương tối thiểu", { exact: true }).fill("15000000");
  await page.getByLabel("Lương tối đa", { exact: true }).fill("25000000");
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  await page.getByLabel("Nội dung câu hỏi 1").fill("Bạn có thể bắt đầu khi nào?");
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeEnabled();
  await expect(page.locator(".jp-content-view")).toContainText(
    "Khu vực làm việc từ xa: Toàn thế giới",
  );
  await expect(page.locator(".jp-content-view")).toContainText(completeContent.description!);
  await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
  await page.getByLabel("Số lượng tuyển", { exact: true }).fill("");
  await page.getByRole("combobox", { name: "Mức lương", exact: true }).selectOption("false");
  await page.getByRole("button", { name: "Xóa câu hỏi 1", exact: true }).click();
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.locator(".jp-content-view")).toContainText("Không công khai mức lương");
  await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
  await page.getByRole("combobox", { name: "Mức lương", exact: true }).selectOption("");
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeEnabled();
  await expect(page.locator(".jp-content-view")).toContainText("Chưa có thông tin lương");
  const saved = mock.writes
    .filter((write) => write.path.endsWith("/draft") && write.method === "PUT")
    .at(-1)!;
  expect(saved.body!.content).not.toHaveProperty("compensation");
  expect(saved.body!.content).not.toHaveProperty("headcount");
  expect((saved.body!.content as JobContent).screeningQuestions).toEqual([]);
});

test("description formatting survives save, refresh and review without interpreting legacy HTML", async ({
  page,
}) => {
  const mock = await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Mô tả công việc", exact: true });
  await editor.fill("Công việc mới");
  await editor.press("ControlOrMeta+a");
  await page.getByRole("button", { name: "In đậm", exact: true }).click();
  await page.getByRole("button", { name: "In nghiêng", exact: true }).click();
  await page.getByRole("button", { name: "Danh sách dấu đầu dòng", exact: true }).click();
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(
    page.locator(".jp-content-view .job-description :is(strong em, em strong)"),
  ).toHaveText("Công việc mới");
  await expect(page.locator(".jp-content-view .job-description li")).toHaveCount(1);
  expect(mock.getJobs()[0].workingRevision!.content.description).toContain("guardwork:markdown:v1");
  await page.reload();
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await expect(editor.locator(":is(strong em, em strong)")).toHaveText("Công việc mới");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await editor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/job-description-editor-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await editor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/job-description-editor-desktop.png", fullPage: true });
  await editor.fill(" ");
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeDisabled();
  await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
  await editor.fill('<script>alert("x")</script>');
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.locator(".job-description")).toContainText('<script>alert("x")</script>');
  await expect(page.locator(".job-description script")).toHaveCount(0);
});

test("public descriptions render saved formatting and ignore executable markup", async ({
  page,
}) => {
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: {
            ...completeContent,
            description:
              "<!-- guardwork:markdown:v1 -->\n**Công việc** và *quyền lợi*\n\n- Đào tạo\n\n<script>alert(1)</script><img src=x onerror=alert(1)>",
          },
        },
      },
    }),
  );
  await page.goto("/jobs?job=42");
  await expect(page.locator(".job-description strong")).toHaveText("Công việc");
  await expect(page.locator(".job-description em")).toHaveText("quyền lợi");
  await expect(page.locator(".job-description li")).toHaveText("Đào tạo");
  await expect(page.locator(".job-description script, .job-description img")).toHaveCount(0);
});

test("job title search submits with filters and survives reload and job navigation", async ({
  page,
}) => {
  await mockJobs(page);
  let fail = false;
  await page.route("**/api/companies/me/jobs?**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (fail) return route.fulfill({ status: 503, json: { status: 503, message: "Unavailable" } });
    const content = params.get("keyword") === "Không có" ? [] : [makeJob()];
    await route.fulfill({ json: { status: 200, data: paged(content) } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?page=2&status=DRAFT");
  const input = page.getByLabel("Tìm theo tiêu đề tin");
  await input.fill("kinh doanh");
  expect(new URL(page.url()).searchParams.has("keyword")).toBe(false);
  const request = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === "/api/companies/me/jobs" &&
      new URL(request.url()).searchParams.get("keyword") === "kinh doanh",
  );
  await input.press("Enter");
  const params = new URL((await request).url()).searchParams;
  expect(params.get("page")).toBe("0");
  expect(params.get("status")).toBe("DRAFT");
  await expect(page.locator(".jp-search-results")).toContainText("1 tin tuyển dụng phù hợp");
  await page.reload();
  await expect(input).toHaveValue("kinh doanh");
  await page.screenshot({ path: "/tmp/recruiter-job-search.png", fullPage: true });
  await noOverflow(page);
  await page.getByRole("link", { name: /^Quản lý Chuyên viên/ }).click();
  await page.goBack();
  await expect(input).toHaveValue("kinh doanh");
  await input.fill("Không có");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Không có tin phù hợp" })).toBeVisible();
  fail = true;
  await input.fill("Kế toán");
  await input.press("Enter");
  await expect(page.getByRole("heading", { name: "Chưa tải được danh sách" })).toBeVisible();
  await expect(input).toHaveValue("Kế toán");
  fail = false;
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.locator(".jp-job-list > li")).toHaveCount(1);
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(input).toHaveValue("");
  await expect(page.getByLabel("Trạng thái xuất bản")).toHaveValue("");
});

test("job rows show application totals with scoped links, zero and unavailable states", async ({
  page,
}) => {
  await mockJobs(page, [
    makeJob(),
    { ...makeJob(), id: 84, applicationCount: 0 },
    { ...makeJob(), id: 85, status: "SUSPENDED", applicationCount: null },
  ]);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs");
  const count = page.getByRole("link", {
    name: "12 ứng viên cho Chuyên viên kinh doanh",
    exact: true,
  });
  await expect(count).toHaveAttribute("href", /jobId=83/);
  await expect(
    page.getByRole("link", { name: "0 ứng viên cho Chuyên viên kinh doanh", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".jp-job-row").last().locator(".jp-job-candidates a")).toHaveCount(0);
  await noOverflow(page);
  await page.screenshot({ path: "/tmp/recruiter-job-candidates.png", fullPage: true });
  // Column labels must line up with their corresponding job-row cells.
  const alignment = await page.evaluate(() => {
    const header = [...document.querySelectorAll(".jp-job-columns > span")];
    const cells = [...document.querySelector(".jp-job-row")!.children];
    return header.map((label, index) =>
      Math.abs(label.getBoundingClientRect().left - cells[index].getBoundingClientRect().left),
    );
  });
  for (const offset of alignment) expect(offset).toBeLessThanOrEqual(1);
  const search = await page.locator(".jp-search").boundingBox();
  const row = await page.locator(".jp-job-row").first().boundingBox();
  expect(search!.x).toBe(row!.x);
  await expect(page.locator(".jp-search")).toHaveCSS("padding-left", "24px");
  await expect(count.locator("strong")).toHaveCSS("font-size", "22px");
  await count.click();
  await expect(page).toHaveURL(/rec\/applications\?jobId=83/);
});

for (const state of ["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const) {
  test(`opening a ${state} job shows the newest JD automatically`, async ({ page }) => {
    const job = makeJob();
    job.workingRevision!.revisionNumber = 2;
    job.workingRevision!.state = state;
    const mock = await mockJobs(page, [job]);
    if (state === "APPROVED" || state === "REJECTED") {
      mock.getJobs()[0].workingRevision = null;
      mock.getJobs()[0].availableActions = ["CREATE_DRAFT"];
    }
    await login(page, "owner_demo", true);
    await page.goto("/rec/jobs?jobId=83");
    await expect(page.getByRole("button", { name: "Bản mới nhất", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page.locator(".jp-content-view")).toContainText(completeContent.description!);
    await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveCount(0);
    expect(mock.writes).toEqual([]);
    await noOverflow(page);
    if (state === "DRAFT") {
      await page.screenshot({ path: "/tmp/job-detail-preview-after.png", fullPage: true });
      await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
      await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
        completeContent.title!,
      );
    }
  });
}

test("latest JD loading failure offers retry without changing the job", async ({ page }) => {
  const mock = await mockJobs(page);
  mock.getJobs()[0].workingRevision = null;
  mock.getJobs()[0].availableActions = ["CREATE_DRAFT"];
  await login(page, "owner_demo", true);
  let unavailable = true;
  await page.route("**/api/companies/me/jobs/83/revisions?**", async (route) => {
    if (unavailable) {
      await route.fulfill({
        status: 503,
        json: { status: 503, message: "Unavailable", data: null },
      });
    } else {
      await route.fallback();
    }
  });
  await page.goto("/rec/jobs?jobId=83");
  await expect(
    page.getByRole("heading", { name: "Chưa tải được nội dung JD", exact: true }),
  ).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.locator(".jp-content-view")).toContainText(completeContent.description!);
  expect(mock.writes).toEqual([]);
});

const scanFixture = (status = "COMPLETED", revisionVersion = 3) => ({
  scanId: 401,
  revisionId: 91,
  revisionVersion,
  status,
  mode: "crawler",
  outdated: false,
  failureCode: null,
  analysisText: "Mô tả: 😀 Chỉ tuyển nam dưới 30 tuổi.",
  profile: "recruitment",
  legalSnapshot: "2026-11",
  asOfDate: "2026-11-12",
  createdAt: stamp,
  report:
    status === "COMPLETED"
      ? {
          schemaVersion: "1",
          mode: "crawler",
          profile: "recruitment",
          legalSnapshot: "2026-11",
          asOfDate: "2026-11-12",
          outcome: "POTENTIAL_RISKS",
          warnings: ["Cần đối chiếu hoàn cảnh tuyển dụng thực tế."],
          usage: { available: false },
          findings: [
            {
              spanText: "Chỉ tuyển nam",
              start: 9,
              end: 22,
              riskType: "DISCRIMINATION",
              severity: "high",
              verdict: "NEEDS_REVIEW",
              explanation: "Yêu cầu về giới tính cần được kiểm tra trong ngữ cảnh công việc.",
              citations: [
                {
                  nodeId: "8",
                  label: "Điều 8",
                  documentNumber: "45/2019/QH14",
                  quote: "Phân biệt đối xử trong lao động.",
                  quoteGrounded: true,
                  effectiveStatus: "UNKNOWN",
                  applicability: "UNVERIFIED",
                },
              ],
            },
          ],
        }
      : null,
});

test("current JD shows inline AI results without a right-side analysis panel", async ({
  page,
}, testInfo) => {
  await mockJobs(page, [
    makeJob({
      ...completeContent,
      description:
        "Phát triển khách hàng doanh nghiệp.\n\nChỉ tuyển nam dưới 30 tuổi.\n\nTư vấn, theo dõi hợp đồng và chăm sóc khách hàng.",
    }),
  ]);
  await page.route("**/revisions/91/scans", (route) =>
    route.fulfill({ json: { status: 200, data: scanFixture() } }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await expect(page.locator(".jp-content-view")).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("jd-analysis.png") });
  const button = page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true });
  await expect(button).toBeInViewport();
  const tab = (await page
    .getByRole("button", { name: "Bản mới nhất", exact: true })
    .boundingBox())!;
  const action = (await button.boundingBox())!;
  expect(Math.abs(tab.y + tab.height / 2 - action.y - action.height / 2)).toBeLessThan(2);
  expect(action.x).toBeGreaterThan(tab.x + tab.width);
  await expect(page.locator(".jp-workspace-main .jp-scan")).toHaveCount(1);
  await expect(page.locator(".jp-workspace-side .jp-scan")).toHaveCount(0);
  await expect(page.locator(".jp-scan h3, .jp-scan-revision, .jp-scan-hint")).toHaveCount(0);
  await button.click();
  await expect(page.locator(".jp-analysis-count")).toHaveText("1 phát hiện");
  await expect(page.locator(".jp-content-view")).toBeInViewport();
  await expect(page.locator(".jp-inline-finding")).toBeInViewport();
  await expect(page.locator(".jp-analysis-count")).toHaveText("1 phát hiện");
  await expect(page.locator(".jp-content-view mark")).toHaveText("Chỉ tuyển nam");
  const inline = page.locator(".jp-inline-finding");
  const highlight = (await page.locator(".jp-content-view mark").boundingBox())!;
  const expand = (await inline.locator("summary").first().boundingBox())!;
  expect(expand.y).toBeGreaterThanOrEqual(highlight.y + highlight.height);
  expect(expand.y - highlight.y - highlight.height).toBeLessThan(24);
  await expect(inline).toHaveAttribute("open", "");
  await expect(inline.locator(".jp-inline-finding-explanation")).toContainText(
    "Yêu cầu về giới tính cần được kiểm tra",
  );
  await inline.locator("summary").first().press("Enter");
  await expect(inline).not.toHaveAttribute("open");
  await expect(inline.locator(".jp-inline-finding-explanation")).toBeHidden();
  await inline.locator("summary").first().press("Enter");
  await expect(inline.locator(".jp-inline-finding-explanation")).toBeVisible();
  await expect(inline.locator("blockquote")).toBeVisible();
  await inline.locator(".jp-inline-citation summary").click();
  await expect(inline.locator("blockquote")).toBeHidden();
  await inline.locator(".jp-inline-citation summary").press("Enter");
  await expect(inline.locator("blockquote")).toBeVisible();
  await expect(page.getByText("Xem báo cáo phân tích đầy đủ", { exact: true })).toHaveCount(0);
  await expect(page.locator(".jp-scan").getByRole("button")).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath("jd-analysis-result.png") });
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Nội dung đang sửa");
  await page.getByRole("button", { name: "Bản mới nhất", exact: true }).click();
  await expect(page.locator(".jp-content-view mark")).toHaveCount(0);
  await expect(page.locator(".jp-analysis-count")).toHaveText("Kết quả cần cập nhật");
});

test("inline results expand independently beneath each highlighted paragraph", async ({ page }) => {
  const description = "Chỉ tuyển nam dưới 30 tuổi.\n\nThử việc 90 ngày.";
  await mockJobs(page, [makeJob({ ...completeContent, description })]);
  const scan = scanFixture();
  const base = scan.report!.findings[0];
  scan.analysisText = description;
  scan.report!.findings = [
    { ...base, start: 0, end: Array.from(base.spanText).length },
    {
      ...base,
      spanText: "Thử việc 90 ngày",
      start: Array.from(description.split("Thử việc")[0]).length,
      end: Array.from(description).length - 1,
      explanation: "Thời gian thử việc cần được kiểm tra theo tính chất công việc.",
      severity: "medium",
      citations: [],
    },
  ];
  await page.route("**/revisions/91/scans", (route) =>
    route.fulfill({ json: { status: 200, data: scan } }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-analysis-count")).toHaveText("2 phát hiện");
  const passages = page.locator(".jp-inline-passage");
  await expect(passages).toHaveCount(2);
  for (const passage of await passages.all()) {
    const mark = (await passage.locator("mark").boundingBox())!;
    const summary = (await passage.locator(".jp-inline-finding > summary").boundingBox())!;
    expect(summary.y).toBeGreaterThanOrEqual(mark.y + mark.height);
    expect(summary.y - mark.y - mark.height).toBeLessThan(24);
    await expect(passage.locator(".jp-inline-finding")).toHaveAttribute("open", "");
    await expect(passage.locator(".jp-inline-finding-explanation")).toBeVisible();
  }
  await passages.first().locator(".jp-inline-finding > summary").press("Enter");
  await expect(passages.first().locator(".jp-inline-finding-explanation")).toBeHidden();
  await expect(passages.last().locator(".jp-inline-finding-explanation")).toBeVisible();
});

test("each finding in one paragraph is followed immediately by its own result and open quotation", async ({
  page,
}, testInfo) => {
  const first = "Ứng viên phải nộp bản chính CCCD và công ty giữ trong suốt thời gian làm việc.";
  const second =
    "Trước khi nhận việc, ứng viên phải đặt cọc 3.000.000 đồng để bảo đảm thực hiện hợp đồng.";
  const description = `Tuyển nhân viên bảo vệ làm việc tại Hồ Chí Minh. ${first} ${second}`;
  await mockJobs(page, [makeJob({ title: "Nhân viên bảo vệ", description })]);
  const scan = scanFixture();
  const base = scan.report!.findings[0];
  scan.analysisText = description;
  scan.report!.findings = [first, second].map((spanText, index) => ({
    ...base,
    spanText,
    start: Array.from(description.slice(0, description.indexOf(spanText))).length,
    end: Array.from(description.slice(0, description.indexOf(spanText) + spanText.length)).length,
    explanation:
      index === 0
        ? "Cần kiểm tra yêu cầu giữ bản chính CCCD theo điều khoản được truy xuất."
        : "Cần kiểm tra yêu cầu đặt cọc để bảo đảm thực hiện hợp đồng theo điều khoản được truy xuất.",
    citations: [
      {
        ...base.citations[0],
        nodeId: `article-17-${index}`,
        label: "Điều 17",
        quote:
          index === 0
            ? "1. Giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động."
            : "2. Yêu cầu người lao động phải thực hiện biện pháp bảo đảm bằng tiền hoặc tài sản khác cho việc thực hiện hợp đồng lao động.",
      },
    ],
  }));
  await page.route("**/revisions/91/scans", (route) =>
    route.fulfill({ json: { status: 200, data: scan } }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-analysis-count")).toHaveText("2 phát hiện");
  const passages = page.locator(".jp-inline-passage");
  await expect(passages).toHaveCount(2);
  for (const [index, passage] of (await passages.all()).entries()) {
    await expect(passage.locator("mark")).toHaveText(index === 0 ? first : second);
    await expect(passage.locator(".jp-inline-finding")).toHaveCount(1);
    await expect(passage.locator(".jp-inline-finding-explanation")).toBeVisible();
    await expect(passage.locator(".jp-inline-citation")).toHaveAttribute("open", "");
    await expect(passage.locator("blockquote")).toBeVisible();
  }
  const firstResult = (await passages.first().locator(".jp-inline-finding").boundingBox())!;
  const secondPassage = (await passages.last().locator(".jp-inline-passage-text").boundingBox())!;
  expect(firstResult.y + firstResult.height).toBeLessThanOrEqual(secondPassage.y);
  await page.screenshot({
    path: testInfo.outputPath("same-paragraph-results.png"),
    animations: "disabled",
  });
  await passages.last().scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("second-passage-result.png"),
    animations: "disabled",
  });
});

test("inline AI annotations preserve emphasis and keep legacy HTML literal", async ({ page }) => {
  await mockJobs(page, [
    makeJob({
      ...completeContent,
      description: "<!-- guardwork:markdown:v1 -->\nYêu cầu: Chỉ **tuyển** nam dưới 30 tuổi.",
    }),
  ]);
  await page.route("**/revisions/91/scans", (route) =>
    route.fulfill({ json: { status: 200, data: scanFixture() } }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-analysis-count")).toHaveText("1 phát hiện");
  expect((await page.locator(".jp-content-view mark").allTextContents()).join("")).toBe(
    "Chỉ tuyển nam",
  );
  await expect(page.locator(".jp-content-view strong mark")).toHaveText("tuyển");
  await page.route("**/api/companies/me/jobs/83", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: makeJob({
          ...completeContent,
          description: "Chỉ tuyển nam dưới 30 tuổi. <img src=x onerror=alert(1)>",
        }),
      },
    }),
  );
  await page.getByRole("button", { name: "Tải dữ liệu mới", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-content-view mark")).toHaveText("Chỉ tuyển nam");
  await expect(page.locator(".jp-content-view")).toContainText("<img src=x onerror=alert(1)>");
  await expect(page.locator(".jp-content-view img")).toHaveCount(0);
});

test("AI scan saves edits, polls, renders code-point snapshot and becomes stale immediately", async ({
  page,
}) => {
  const mock = await mockJobs(page);
  const calls: string[] = [];
  await page.route("**/revisions/91/scans**", async (route) => {
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    calls.push(route.request().method());
    if (route.request().method() === "POST") {
      expect(mock.writes.at(-1)?.path).toBe("/api/companies/me/jobs/83/draft");
      expect(route.request().postDataJSON()).toEqual({ expectedRevisionVersion: 4 });
      return route.fulfill({ json: { status: 200, data: scanFixture("QUEUED", 4) } });
    }
    return route.fulfill({ json: { status: 200, data: scanFixture("COMPLETED", 4) } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Chuyên viên kinh doanh mới");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.getByText("Đang chờ phân tích", { exact: true })).toBeVisible();
  await expect(page.getByText("Phát hiện dấu hiệu rủi ro", { exact: true })).toBeVisible();
  expect(calls).toEqual(["POST", "GET"]);
  await page.getByText("45/2019/QH14 · Điều 8", { exact: true }).click();
  await expect(page.getByText("Cần xác minh hiệu lực điều khoản", { exact: true })).toBeVisible();
  await page.getByText("Xem bản nội dung đã phân tích", { exact: true }).click();
  await expect(page.locator(".jp-scan-snapshot mark")).toHaveText("Chỉ tuyển nam");
  await expect(
    page.getByText("Kết quả thuộc phiên bản nội dung hoặc dữ liệu phân tích trước đó", {
      exact: true,
    }),
  ).toHaveCount(0);
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Nội dung chưa lưu");
  await expect(
    page.getByText("Kết quả thuộc phiên bản nội dung hoặc dữ liệu phân tích trước đó", {
      exact: true,
    }),
  ).toBeVisible();
  await page.locator(".jp-scan").scrollIntoViewIfNeeded();
  await page.locator(".jp-scan").evaluate((element) => {
    element.scrollIntoView({ block: "start" });
    const main = element.closest("main");
    if (main) main.scrollTop -= 24;
  });
  await page.screenshot({ path: ".impeccable/review/job-scan-panel-desktop.png", fullPage: true });
  await page.locator(".jp-scan-snapshot").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: ".impeccable/review/job-scan-snapshot-desktop.png",
    fullPage: true,
  });
  await page.locator("main").evaluate((element) => {
    element.scrollTop = 0;
  });
  await page.screenshot({ path: ".impeccable/review/job-scan-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Lưu và xem trước", exact: true }).click();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt", exact: true })).toBeEnabled();
});

for (const status of [400, 403, 404, 503]) {
  test(`AI scan ${status} leaves ordinary job actions available`, async ({ page }) => {
    await mockJobs(page);
    await page.route("**/revisions/91/scans", (route) =>
      route.fulfill({ status, json: { status, message: "unavailable", data: null } }),
    );
    await login(page, "owner_demo", true);
    await page.goto("/rec/jobs?jobId=83");
    await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
    await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
    await expect(page.locator(".jp-scan [role=alert]")).toBeVisible();
    if (status === 503) await expect(page.locator(".jp-scan")).toContainText("hiện đang tắt");
    await expect(page.getByRole("button", { name: "Lưu bản nháp", exact: true })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Lưu và xem trước", exact: true })).toBeEnabled();
  });
}

test("AI scan requires description and reuses failed scans without promising a fresh retry", async ({
  page,
}) => {
  await mockJobs(page, [makeJob({ ...completeContent, description: "" })]);
  let requests = 0;
  await page.route("**/revisions/91/scans", (route) => {
    requests++;
    return route.fulfill({
      json: {
        status: 200,
        data: { ...scanFixture("FAILED", 4), mode: "stub", failureCode: "INTERNAL_SECRET" },
      },
    });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-scan [role=alert]")).toContainText("nhập mô tả");
  expect(requests).toBe(0);
  await page.locator(".tiptap").fill("Mô tả công việc hợp lệ");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-scan")).toContainText("Không thể hoàn tất phân tích");
  await expect(page.locator(".jp-scan")).toContainText(
    "Chế độ thử nghiệm — chưa thực hiện phân tích AI",
  );
  await expect(page.locator(".jp-scan")).not.toContainText("INTERNAL_SECRET");
  await expect(page.locator(".jp-scan").getByRole("button", { name: /Thử lại/ })).toHaveCount(0);
});

test("AI scan conflict reloads current revision version before requesting again", async ({
  page,
}) => {
  await mockJobs(page);
  let requests = 0;
  await page.route("**/revisions/91/scans", async (route) => {
    requests++;
    if (requests === 1) return route.fulfill({ status: 409, json: { status: 409, data: null } });
    expect(route.request().postDataJSON()).toEqual({ expectedRevisionVersion: 8 });
    return route.fulfill({ json: { status: 200, data: scanFixture("COMPLETED", 8) } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await expect(
    page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }),
  ).toBeVisible();
  await page.route("**/api/companies/me/jobs/83", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: { ...makeJob(), workingRevision: { ...makeJob().workingRevision, version: 8 } },
      },
    }),
  );
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-analysis-count")).toHaveText("1 phát hiện");
  expect(requests).toBe(2);
});

test("AI scan stops polling on loss of access and on leaving the editor", async ({ page }) => {
  await mockJobs(page);
  let polls = 0;
  let deny = true;
  await page.route("**/revisions/91/scans**", (route) => {
    if (route.request().method() === "GET") {
      polls++;
      if (deny) return route.fulfill({ status: 403, json: { status: 403, data: null } });
    }
    return route.fulfill({ json: { status: 200, data: scanFixture("RUNNING") } });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.locator(".jp-scan [role=alert]")).toContainText("không có quyền");
  await page.waitForTimeout(2400);
  expect(polls).toBe(1);
  await expect(page.locator(".jp-scan-result")).toHaveCount(0);
  deny = false;
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect(page.getByText("Đang phân tích nội dung", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await page.waitForTimeout(2400);
  expect(polls).toBe(1);
});

test("AI scan ignores a late response after loading another revision", async ({ page }) => {
  await mockJobs(page);
  let release!: () => void;
  let started = false;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/revisions/91/scans", async (route) => {
    started = true;
    await pending;
    await route.fulfill({ json: { status: 200, data: scanFixture() } }).catch(() => {});
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }).click();
  await expect.poll(() => started).toBe(true);
  await page.route("**/api/companies/me/jobs/83", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          ...makeJob(),
          workingRevision: {
            ...makeJob().workingRevision,
            id: 92,
            version: 1,
            content: { ...completeContent, title: "Phiên bản khác" },
          },
        },
      },
    }),
  );
  await page.getByRole("button", { name: "Tải dữ liệu mới", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Phiên bản khác", exact: true, level: 1 }),
  ).toBeVisible();
  release();
  await expect(page.locator(".jp-scan-result")).toHaveCount(0);
  await expect(page.locator(".jp-scan")).not.toContainText("Phát hiện dấu hiệu rủi ro");
});

test("draft editor highlights AI findings and rescans after five idle seconds", async ({
  page,
}, testInfo) => {
  test.setTimeout(45000);
  const mock = await mockJobs(page, [
    makeJob({ ...completeContent, description: "Chỉ tuyển nam dưới 30 tuổi." }),
  ]);
  let scans = 0;
  await page.route("**/revisions/91/scans", async (route) => {
    scans++;
    await route.fulfill({
      json: {
        status: 200,
        data: scanFixture("COMPLETED", mock.getJobs()[0].workingRevision!.version),
      },
    });
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  const editor = page.getByRole("textbox", { name: "Mô tả công việc", exact: true });
  await expect(editor).toBeVisible();
  await expect(page.getByRole("heading", { name: "Phân tích JD bằng AI" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Kiểm tra nội dung với AI", exact: true }),
  ).toHaveCount(0);
  await expect(editor.locator(".jp-editor-mark")).toHaveText("Chỉ tuyển nam", { timeout: 10000 });
  expect(scans).toBe(1);
  const mark = editor.locator(".jp-editor-mark");
  await editor.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await mark.hover();
  const popup = page.getByRole("region", { name: "Kết quả phân tích AI" });
  await expect(popup).toContainText("Yêu cầu về giới tính cần được kiểm tra");
  await popup.getByText("45/2019/QH14 · Điều 8", { exact: true }).click();
  await expect(popup).toContainText("Phân biệt đối xử trong lao động.");
  await page.screenshot({ path: testInfo.outputPath("editor-ai-popup.png") });
  await mark.focus();
  await mark.press("Escape");
  await expect(popup).toHaveCount(0);
  await editor.focus();
  await mark.focus();
  await expect(popup).toBeVisible();
  await editor.fill("Chỉ tuyển nam. Đang sửa nội dung.");
  await expect(editor.locator(".jp-editor-mark")).toHaveCount(0);
  await expect(popup).toHaveCount(0);
  await page.waitForTimeout(3000);
  expect(scans).toBe(1);
  await editor.fill("Chỉ tuyển nam. Nội dung mới đã hoàn tất.");
  await page.waitForTimeout(3000);
  expect(scans).toBe(1);
  await expect(editor.locator(".jp-editor-mark")).toHaveText("Chỉ tuyển nam", { timeout: 6000 });
  expect(scans).toBe(2);
  expect(mock.getJobs()[0].workingRevision!.content.description).toBe(
    "Chỉ tuyển nam. Nội dung mới đã hoàn tất.",
  );
  await page.getByRole("button", { name: "Bản mới nhất", exact: true }).click();
  await expect(page.locator(".jp-content-view mark")).toHaveText("Chỉ tuyển nam");
});

test("draft editor keeps typing available when automatic analysis is unavailable", async ({
  page,
}) => {
  await mockJobs(page, [makeJob({ ...completeContent, description: "Nội dung mô tả." })]);
  let unavailable = true;
  await page.route("**/revisions/91/scans", (route) =>
    route.fulfill(
      unavailable
        ? { status: 503, json: { status: 503, message: "Unavailable" } }
        : { json: { status: 200, data: scanFixture() } },
    ),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=83");
  await page.getByRole("button", { name: "Soạn tin", exact: true }).click();
  const field = page.locator(".job-description-field");
  await expect(field.getByRole("alert")).toContainText("hiện đang tắt", { timeout: 10000 });
  await expect(field.getByRole("textbox")).toHaveAttribute("contenteditable", "true");
  unavailable = false;
  await field.getByRole("button", { name: "Thử lại" }).click();
  await expect(field.getByRole("status")).toContainText("1 phát hiện");
});
