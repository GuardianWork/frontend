import { test, expect, login } from "./fixtures";

async function setup(page: import("@playwright/test").Page) {
  const state = { suspended: true, evidenceReads: 0, revisionReads: 0, writes: 0 };
  const content = {
    title: "Tin kiểm thử đình chỉ",
    description: "Mô tả công việc được giữ lại để nhà tuyển dụng xem thông tin.",
    location: "Hà Nội",
  };
  const job = () => ({
    id: 42,
    companyId: 101,
    creatorUserId: 2,
    status: state.suspended ? "SUSPENDED" : "PUBLISHED",
    version: 5,
    ownerResponsible: true,
    needsReassignment: false,
    workingRevision: null,
    publishedRevisionId: 91,
    approvedDeadline: "2028-01-01T00:00:00Z",
    assignments: [],
    availableActions: ["PREVIEW", "SAVE_DRAFT", "PAUSE", "CLOSE"],
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
  });
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      json: {
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
  await page.route(/\/api\/companies\/me\/jobs\/42(?:\?.*)?$/, (route) =>
    route.fulfill({ json: { data: job() } }),
  );
  await page.route(/\/api\/companies\/me\/jobs\/42\/revisions.*/, (route) => {
    state.revisionReads++;
    return route.fulfill({
      json: {
        data: {
          content: [{ id: 91, revisionNumber: 1, state: "APPROVED", version: 1, content }],
          pageNumber: 0,
          pageSize: 1,
          totalElements: 1,
          totalPages: 1,
        },
      },
    });
  });
  const detail = {
    id: "a1",
    jobId: 42,
    jobTitle: content.title,
    companyName: "Công ty Alpha",
    candidateName: "Ứng viên riêng tư",
    email: "private@example.test",
    phoneNumber: "0901234567",
    coverLetter: "Nội dung riêng tư",
    cvFileName: "private.pdf",
    cvContentType: "application/pdf",
    cvFileSize: 128,
    status: "SUBMITTED",
    version: 1,
    appliedAt: "2026-11-01T00:00:00Z",
    history: [],
    candidateFeedback: null,
  };
  await page.route(/\/api\/companies\/me\/(?:jobs\/42\/applications|applications).*/, (route) => {
    state.evidenceReads++;
    if (route.request().method() !== "GET") state.writes++;
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/cv"))
      return route.fulfill({ contentType: "application/pdf", body: "%PDF-1.7\n%%EOF" });
    return route.fulfill({
      json: {
        data: path.endsWith("/a1")
          ? detail
          : {
              content: [detail],
              pageNumber: 0,
              pageSize: 20,
              totalElements: 1,
              totalPages: 1,
              first: true,
              last: true,
            },
      },
    });
  });
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({
      status: state.suspended ? 404 : 200,
      json: state.suspended
        ? { message: "Not found" }
        : {
            data: {
              id: 42,
              content,
              company: { id: 101, name: "Công ty Alpha" },
              publicationStatus: "PUBLISHED",
            },
          },
    }),
  );
  await page.route("**/api/jobs/search?**", (route) =>
    route.fulfill({
      json: {
        data: {
          content: state.suspended
            ? []
            : [
                {
                  id: 42,
                  content,
                  company: { id: 101, name: "Công ty Alpha" },
                  publicationStatus: "PUBLISHED",
                },
              ],
          pageNumber: 0,
          pageSize: 9,
          totalElements: state.suspended ? 0 : 1,
          totalPages: state.suspended ? 0 : 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  return state;
}

test("suspended recruiter job retains read-only information without management or application controls", async ({
  page,
}, info) => {
  const state = await setup(page);
  await login(page, "owner_demo", true);
  await page.goto("/rec/jobs?jobId=42");
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng đã bị đình chỉ", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".jp-workspace-grid")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Xem đơn ứng tuyển", exact: true })).toHaveCount(0);
  expect(state.revisionReads).toBe(1);
  await expect(
    page.getByText("Mô tả công việc được giữ lại để nhà tuyển dụng xem thông tin.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.locator(".jp-suspended-details button, .jp-suspended-details form"),
  ).toHaveCount(0);
  expect(state.evidenceReads).toBe(0);
  await page.screenshot({ path: info.outputPath("suspended-recruiter-job.png") });
});

test("direct application and scoped inbox links reveal no candidate or CV for a suspended job", async ({
  page,
}) => {
  const state = await setup(page);
  await login(page, "owner_demo", true);
  for (const path of ["/rec/applications/42/a1", "/rec/applications?jobId=42"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "Tin tuyển dụng đã bị đình chỉ", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Ứng viên riêng tư", { exact: true })).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveCount(0);
  }
  expect(state.evidenceReads).toBe(0);
});

test("an already open application revokes its PDF and clears personal evidence on suspension", async ({
  page,
}) => {
  const state = await setup(page);
  state.suspended = false;
  await page.addInitScript(() => {
    const original = URL.revokeObjectURL;
    (window as unknown as { revoked: string[] }).revoked = [];
    URL.revokeObjectURL = (url) => {
      (window as unknown as { revoked: string[] }).revoked.push(url);
      original.call(URL, url);
    };
  });
  await login(page, "owner_demo", true);
  await page.goto("/rec/applications/42/a1");
  await page.getByRole("button", { name: "Xem CV PDF", exact: true }).click();
  await expect(page.locator("iframe.application-pdf")).toHaveCount(1);
  state.suspended = true;
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng đã bị đình chỉ", exact: true }),
  ).toBeVisible({ timeout: 12000 });
  await expect(page.locator("iframe.application-pdf")).toHaveCount(0);
  await expect(page.getByText("private@example.test", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as { revoked: string[] }).revoked.length),
  ).toBeGreaterThan(0);
  expect(state.writes).toBe(0);
});

test("guest detail discards a posting that is suspended after it was opened", async ({ page }) => {
  const state = await setup(page);
  state.suspended = false;
  await page.goto("/jobs?job=42");
  await expect(
    page.getByRole("heading", { name: "Tin kiểm thử đình chỉ", exact: true }).first(),
  ).toBeVisible();
  state.suspended = true;
  await page.evaluate(() => window.dispatchEvent(new Event("visibilitychange")));
  await expect(
    page.getByRole("heading", { name: "Tin tuyển dụng không còn khả dụng", exact: true }),
  ).toBeVisible({ timeout: 12000 });
  await expect(
    page.getByText("Mô tả công việc được giữ lại để nhà tuyển dụng xem thông tin.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("candidate application form clears a job when it becomes unavailable", async ({ page }) => {
  const state = await setup(page);
  state.suspended = false;
  await login(page, "candidate_demo");
  await page.goto("/can/jobs/apply?job=42");
  await expect(page.getByText("Tin kiểm thử đình chỉ", { exact: true })).toBeVisible();
  state.suspended = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Tin kiểm thử đình chỉ", { exact: true })).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
});

test("a late public response cannot restore a candidate form after a newer unavailable response", async ({
  page,
}) => {
  const state = await setup(page);
  state.suspended = false;
  await login(page, "candidate_demo");
  await page.goto("/can/jobs/apply?job=42");
  await expect(page.getByText("Tin kiểm thử đình chỉ", { exact: true })).toBeVisible();
  let release: () => void = () => {};
  const delayed = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route("**/api/jobs/42", async (route) => {
    if (++calls === 1) {
      await delayed;
      return route.fulfill({
        json: {
          data: { id: 42, publicationStatus: "PUBLISHED", content: { title: "Phản hồi cũ" } },
        },
      });
    }
    return route.fulfill({ status: 404, json: { message: "Not found" } });
  });
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect.poll(() => calls).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Tin kiểm thử đình chỉ", { exact: true })).toHaveCount(0);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/jobs/42") && r.status() === 200,
  );
  release();
  await (await response).finished();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  await expect(page.getByText("Phản hồi cũ", { exact: true })).toHaveCount(0);
  await expect(page.locator("form")).toHaveCount(0);
});
