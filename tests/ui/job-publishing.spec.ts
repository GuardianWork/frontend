import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
import type { Job, JobContent, RevisionHistory } from "../../src/services/jobs";

const completeContent: JobContent = {
  title: "Chuyên viên kinh doanh",
  description: "Phát triển khách hàng doanh nghiệp.",
  responsibilities: "Tư vấn và theo dõi hợp đồng.",
  requiredQualifications: "Giao tiếp rõ ràng.",
  preferredQualifications: "Ưu tiên kinh nghiệm bán hàng.",
  experienceExpectations: "Một năm kinh nghiệm.",
  benefits: "Bảo hiểm và đào tạo chuyên môn.",
  location: "Hà Nội",
  applicationInstructions: "Gửi CV bằng tiếng Việt.",
  employmentType: "FULL_TIME",
  workArrangement: "ONSITE",
  deadline: "2099-12-01T10:00:00Z",
  headcount: 2,
  compensation: {
    disclosed: true,
    minimum: 15000000,
    maximum: 25000000,
    currency: "VND",
    payPeriod: "MONTH",
  },
};
const stamp = "2026-10-27T01:00:00Z";
function makeJob(content: JobContent = completeContent): Job {
  return {
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
        "responsibilities",
        "requiredQualifications",
        "preferredQualifications",
        "experienceExpectations",
        "benefits",
        "location",
        "applicationInstructions",
        "employmentType",
        "workArrangement",
        "deadline",
        "headcount",
        "compensation",
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

test("owner creates an incomplete draft, sees validation, completes and submits the persisted revision", async ({
  page,
}, info) => {
  const mock = await mockJobs(page, []);
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs");
  await expect(
    page.getByRole("heading", { name: "Bắt đầu với tin tuyển dụng đầu tiên" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tạo tin tuyển dụng" }).first().click();
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Chuyên viên kinh doanh");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page).toHaveURL(/jobId=83/);
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  await expect(page.getByText("Cần hoàn tất trước khi gửi", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeDisabled();
  await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
  for (const [label, value] of [
    ["Giới thiệu công việc", completeContent.description],
    ["Trách nhiệm công việc", completeContent.responsibilities],
    ["Yêu cầu bắt buộc", completeContent.requiredQualifications],
    ["Yêu cầu ưu tiên", completeContent.preferredQualifications],
    ["Kinh nghiệm mong đợi", completeContent.experienceExpectations],
    ["Quyền lợi", completeContent.benefits],
    ["Hướng dẫn ứng tuyển", completeContent.applicationInstructions],
    ["Địa điểm làm việc", completeContent.location],
  ])
    await page.getByLabel(label!, { exact: true }).fill(value!);
  await page
    .getByRole("combobox", { name: "Loại công việc", exact: true })
    .selectOption("FULL_TIME");
  await page
    .getByRole("combobox", { name: "Hình thức làm việc", exact: true })
    .selectOption("ONSITE");
  await page.getByLabel("Số lượng tuyển", { exact: true }).fill("2");
  await page.getByLabel("Hạn ứng tuyển", { exact: true }).fill("2099-12-01T17:00");
  await page.getByRole("combobox", { name: "Mức lương", exact: true }).selectOption("true");
  await page.getByLabel("Lương tối thiểu", { exact: true }).fill("15000000");
  await page.getByLabel("Lương tối đa", { exact: true }).fill("25000000");
  await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  await page.getByLabel("Nội dung câu hỏi 1").fill("Bạn có thể bắt đầu khi nào?");
  await page.screenshot({
    path: `/tmp/job-publishing-${info.project.name}-editor.png`,
    fullPage: true,
  });
  await noOverflow(page);
  await page.getByRole("button", { name: "Lưu và xem trước" }).click();
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
  const saved = mock.writes.find(
    (write) => write.method === "PUT" && write.path.endsWith("/draft"),
  );
  expect((saved!.body!.content as JobContent).screeningQuestions?.[0].prompt).toBe(
    "Bạn có thể bắt đầu khi nào?",
  );
});

test("assignment preserves typed content and stale edits never report success", async ({
  page,
}, info) => {
  const mock = await mockJobs(page);
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?jobId=83");
  await page.getByLabel("Chức danh công việc", { exact: true }).fill("Bản sửa chưa lưu");
  await page.getByLabel("Tôi chịu trách nhiệm").click();
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
  await page.goto("/recruiter/jobs");
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
  await page.goto("/recruiter/jobs?jobId=83");
  await expect(
    page.getByText("Bạn có quyền truy cập vì được phân công.", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Tôi chịu trách nhiệm")).toHaveCount(0);
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
  await page.goto("/recruiter/jobs?jobId=83");
  await expect(page.getByText(rejected.rejectionReason, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Bản v1 · Chuyên viên kinh doanh", exact: true }).click();
  await expect(page.locator(".jp-history-content")).toContainText(completeContent.description!);
  await page.getByRole("button", { name: "Tạo bản chỉnh sửa", exact: true }).click();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
    completeContent.title!,
  );
  await expect(page.getByText("Bản nháp · v2", { exact: true })).toBeVisible();
});

test("expired jobs with unfinished revisions open in readable history without an editor", async ({
  page,
}) => {
  const job = makeJob();
  job.status = "EXPIRED";
  job.availableActions = [];
  await mockJobs(page, [job]);
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/jobs?jobId=83");
  await expect(page.getByRole("heading", { name: "Lịch sử xét duyệt", exact: true })).toBeVisible();
  await expect(page.getByText("Tin đã kết thúc.", { exact: false })).toBeVisible();
  await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveCount(0);
});
