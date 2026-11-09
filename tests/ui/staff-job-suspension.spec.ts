import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

async function setup(page: import("@playwright/test").Page, suspended = false) {
  const api = await staffJobApi(page);
  api.review.state = "APPROVED";
  api.review.approvalEligible = false;
  const state = {
    public: !suspended,
    hidden: suspended,
    status: 200,
    calls: 0,
    conflict: false,
    version: 9,
  };
  api.review.jobVersion = state.version;
  await page.route("**/api/staff/jobs/83/history?*", (route) =>
    route.fulfill({
      json: {
        data: {
          content:
            state.hidden && !state.public
              ? [
                  {
                    eventType: "JOB_SUSPENDED",
                    status: "SUSPENDED",
                    actorUserId: 4,
                    createdAt: "2026-11-01T00:00:00Z",
                    reason: "Violation",
                  },
                ]
              : [],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.route("**/api/staff/jobs/83/restore", (route) => {
    state.calls++;
    expect(route.request().method()).toBe("PUT");
    expect(route.request().headers().authorization).toMatch(/^Bearer mock-access-/);
    expect(route.request().postDataJSON()).toEqual({
      expectedJobVersion: state.version,
      reason: "Đã giải quyết vi phạm.",
    });
    if (state.conflict)
      return route.fulfill({ status: 409, json: { message: "40022 CONCURRENT_MODIFICATION" } });
    if (state.status !== 200)
      return route.fulfill({ status: state.status, json: { message: "40978 JOB_STATE_CONFLICT" } });
    state.public = true;
    api.review.jobVersion++;
    return route.fulfill({
      json: {
        data: {
          jobId: 83,
          publicationStatus: "PUBLISHED",
          jobVersion: api.review.jobVersion,
        },
      },
    });
  });
  await page.route("**/api/jobs/83", (route) =>
    route.fulfill({
      status: state.public ? 200 : 404,
      json: state.public
        ? {
            data: {
              id: 83,
              publicationStatus: "PUBLISHED",
              content: { title: "Bản tin đang công khai" },
            },
          }
        : { message: "Not found" },
    }),
  );
  await page.route("**/api/staff/jobs/83/hide", (route) => {
    state.calls++;
    expect(route.request().method()).toBe("PUT");
    expect(route.request().headers().authorization).toMatch(/^Bearer mock-access-/);
    const payload = route.request().postDataJSON();
    expect(payload.expectedJobVersion).toBe(state.version);
    expect(payload.reason).toBe("Thông tin tuyển dụng không chính xác.");
    if (state.conflict)
      return route.fulfill({ status: 409, json: { message: "CONCURRENT_MODIFICATION" } });
    if (state.status !== 200)
      return route.fulfill({ status: state.status, json: { message: "Unavailable" } });
    state.public = false;
    state.hidden = true;
    api.review.jobVersion++;
    return route.fulfill({
      json: { data: { jobId: 83, publicationStatus: "SUSPENDED", jobVersion: state.version + 1 } },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs`);
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("APPROVED");
  await page.getByRole("button", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  return { api, state };
}

test("published jobs can be suspended from detail using the freshly inspected version", async ({
  page,
}, info) => {
  const { api, state } = await setup(page);
  api.review.jobVersion = state.version;
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Bản tin đang công khai", { exact: true })).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true });
  await expect(confirm).toBeDisabled();
  await page.mouse.click(100, 100);
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Lý do đình chỉ", { exact: true }).fill("😀".repeat(1001));
  await expect(confirm).toBeDisabled();
  await dialog
    .getByLabel("Lý do đình chỉ", { exact: true })
    .fill("  Thông tin tuyển dụng không chính xác.  ");
  await expect(confirm).toBeEnabled();
  await page.screenshot({ path: info.outputPath("suspend-confirmation-desktop.png") });
  await confirm.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".staff-publication-receipt")).toContainText(
    "Đã đình chỉ tin tuyển dụng",
  );
  await expect(
    page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".staff-publication-controls")).toContainText("Đã đình chỉ");
  expect(state.calls).toBe(1);
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.locator(".staff-posting-history")).toHaveCount(0);
});

test("a suspension conflict retains the reason and requires explicit inspection before retry", async ({
  page,
}) => {
  const { api, state } = await setup(page);
  api.review.jobVersion = state.version;
  state.conflict = true;
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const reason = dialog.getByLabel("Lý do đình chỉ", { exact: true });
  await reason.fill("Thông tin tuyển dụng không chính xác.");
  await dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Tin đã thay đổi");
  await expect(reason).toHaveValue("Thông tin tuyển dụng không chính xác.");
  await expect(dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true })).toHaveCount(
    0,
  );
  expect(state.calls).toBe(1);
  state.conflict = false;
  api.review.jobVersion = ++state.version;
  await dialog.getByRole("button", { name: "Tải lại trạng thái tin", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.calls).toBe(2);
});

test("a posting that stops being public during inspection cannot be suspended", async ({
  page,
}) => {
  const { state } = await setup(page);
  await expect(
    page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }),
  ).toBeVisible();
  state.public = false;
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("status")).toContainText("không đủ điều kiện");
  await dialog
    .getByLabel("Lý do đình chỉ", { exact: true })
    .fill("Thông tin tuyển dụng không chính xác.");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }),
  ).toBeDisabled();
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(page.locator(".staff-publication-controls")).toContainText("Không có tin công khai");
  expect(state.calls).toBe(0);
});

test("permission errors do not report a successful suspension or automatically resend", async ({
  page,
}) => {
  const { api, state } = await setup(page);
  api.review.jobVersion = state.version;
  state.status = 403;
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Lý do đình chỉ", { exact: true })
    .fill("Thông tin tuyển dụng không chính xác.");
  await dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("không có quyền");
  await expect(page.getByText(/Đã đình chỉ tin tuyển dụng/)).toHaveCount(0);
  expect(state.calls).toBe(1);
});

test("an uncertain suspension response is inspected before any second submission", async ({
  page,
}) => {
  const { api, state } = await setup(page);
  api.review.jobVersion = state.version;
  state.status = 503;
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const reason = dialog.getByLabel("Lý do đình chỉ", { exact: true });
  await reason.fill("Thông tin tuyển dụng không chính xác.");
  await dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }).click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(reason).toHaveValue("Thông tin tuyển dụng không chính xác.");
  state.public = false;
  await dialog.getByRole("button", { name: "Tải lại trạng thái tin", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("không đủ điều kiện");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }),
  ).toBeDisabled();
  expect(state.calls).toBe(1);
});

test("staff restores a suspended posting discovered through private history", async ({
  page,
}, info) => {
  const { state } = await setup(page, true);
  await expect(page.locator(".staff-publication-controls")).toContainText("Đã đình chỉ");
  await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const reason = dialog.getByLabel("Lý do khôi phục", { exact: true });
  const confirm = dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true });
  await expect(confirm).toBeDisabled();
  await reason.fill("😀".repeat(1001));
  await expect(confirm).toBeDisabled();
  await reason.fill("  Đã giải quyết vi phạm.  ");
  await expect(confirm).toBeEnabled();
  await page.screenshot({ path: info.outputPath("restore-confirmation-desktop.png") });
  await confirm.click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".staff-publication-receipt")).toContainText(
    "Đã khôi phục tin tuyển dụng",
  );
  await expect(page.locator(".staff-publication-controls")).toContainText("Đang công khai");
  await expect(
    page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }),
  ).toBeVisible();
  expect(state.calls).toBe(1);
});

test("restore conflict keeps the reason and reinspects the current version before retry", async ({
  page,
}) => {
  const { api, state } = await setup(page, true);
  state.conflict = true;
  await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const reason = dialog.getByLabel("Lý do khôi phục", { exact: true });
  await reason.fill("Đã giải quyết vi phạm.");
  await dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Tin đã thay đổi");
  await expect(reason).toHaveValue("Đã giải quyết vi phạm.");
  await expect(dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true })).toHaveCount(
    0,
  );
  state.conflict = false;
  api.review.jobVersion = ++state.version;
  await dialog.getByRole("button", { name: "Tải lại trạng thái tin", exact: true }).click();
  await dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.calls).toBe(2);
});

for (const status of [403, 409, 503]) {
  test(`restore failure ${status} never reports success or retries automatically`, async ({
    page,
  }) => {
    const { state } = await setup(page, true);
    state.status = status;
    await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Lý do khôi phục", { exact: true }).fill("Đã giải quyết vi phạm.");
    await dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
    await expect(page.locator(".staff-publication-receipt")).toHaveCount(0);
    await expect(
      dialog.getByRole("button", { name: "Tải lại trạng thái tin", exact: true }),
    ).toBeVisible();
    expect(state.calls).toBe(1);
  });
}

test("restore is disabled if the posting becomes public during inspection", async ({ page }) => {
  const { state } = await setup(page, true);
  await expect(
    page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }),
  ).toBeVisible();
  state.public = true;
  await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("status")).toContainText("không đủ điều kiện khôi phục");
  await dialog.getByLabel("Lý do khôi phục", { exact: true }).fill("Đã giải quyết vi phạm.");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }),
  ).toBeDisabled();
  expect(state.calls).toBe(0);
});

test("restoration checks fresh company eligibility", async ({ page }) => {
  const { api, state } = await setup(page, true);
  api.review.companySuspended = true;
  await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("status")).toContainText("không đủ điều kiện khôi phục");
  await dialog.getByLabel("Lý do khôi phục", { exact: true }).fill("Đã giải quyết vi phạm.");
  await expect(
    dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }),
  ).toBeDisabled();
  expect(state.calls).toBe(0);
});

test("a successful suspension exposes restoration and survives status reload", async ({ page }) => {
  const { state } = await setup(page);
  await page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Lý do đình chỉ", { exact: true })
    .fill("Thông tin tuyển dụng không chính xác.");
  await dialog.getByRole("button", { name: "Xác nhận đình chỉ", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }),
  ).toBeVisible();
  state.version++;
  await page.getByRole("button", { name: "Khôi phục tin tuyển dụng", exact: true }).click();
  await dialog.getByLabel("Lý do khôi phục", { exact: true }).fill("Đã giải quyết vi phạm.");
  await dialog.getByRole("button", { name: "Xác nhận khôi phục", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Đình chỉ tin tuyển dụng", exact: true }),
  ).toBeVisible();
  expect(state.calls).toBe(2);
});
