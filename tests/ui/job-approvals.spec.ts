import { test, expect, login } from "./fixtures";

test("admin reviews browser-local employer submissions and decisions survive reload", async ({
  page,
}, info) => {
  await login(page, "admin_demo");
  await page.evaluate(() => {
    const jobs = [
      { id: "approval-accounting", title: "Kế toán tổng hợp", department: "Tài chính" },
      { id: "approval-sales", title: "Chuyên viên kinh doanh", department: "Kinh doanh" },
    ].map((job) => ({
      ...job,
      authorId: "hr",
      companyName: "Công ty Minh An",
      companyTaxCode: "0312345678",
      location: "TP. Hồ Chí Minh",
      salary: "15.000.000 – 25.000.000 VND / tháng",
      status: "Active",
      moderationStatus: "pending",
      created: "2026-10-21T08:00:00Z",
    }));
    localStorage.setItem(
      "guardianwork_company_members_42_0312345678",
      JSON.stringify({
        members: [{ id: "hr", name: "Nguyễn Thu Hà", status: "active" }],
        jobs,
        grants: [],
        applications: [],
      }),
    );
  });
  await page.goto("/admin/job-approvals");
  await expect(
    page.getByRole("heading", { name: "Quản lý tin tuyển dụng", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/jobs$/);
  await expect(page.locator(".approval-list li")).toHaveCount(2);
  await page.screenshot({
    path: `/tmp/guardian-approvals-${info.project.name}-list.png`,
    fullPage: true,
  });
  await page.getByRole("searchbox").fill("ke toan");
  await expect(page.locator(".approval-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "Kế toán tổng hợp", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kế toán tổng hợp", exact: true })).toBeFocused();
  await page.screenshot({
    path: `/tmp/guardian-approvals-${info.project.name}-detail.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Phê duyệt tin", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kết quả xét duyệt" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Phê duyệt tin", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  await page.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }).click();
  await page.getByRole("button", { name: "Chuyên viên kinh doanh", exact: true }).click();
  await page.getByRole("button", { name: "Từ chối tin", exact: true }).click();
  await page.getByLabel("Lý do từ chối").fill("   ");
  await expect(page.getByRole("button", { name: "Xác nhận từ chối" })).toBeDisabled();
  await page.getByLabel("Lý do từ chối").fill("Vui lòng làm rõ mức lương và phụ cấp.");
  await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(
    page.getByText("Vui lòng làm rõ mức lương và phụ cấp.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /^Chờ duyệt/ }).click();
  await expect(page.getByRole("heading", { name: "Chưa có tin chờ duyệt" })).toBeVisible();
  await page.getByRole("button", { name: /Đã từ chối/ }).click();
  await page.getByRole("button", { name: "Chuyên viên kinh doanh", exact: true }).click();
  await expect(
    page.getByText("Vui lòng làm rõ mức lương và phụ cấp.", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth + 1 ||
        document.querySelector("main")!.scrollWidth >
          document.querySelector("main")!.clientWidth + 1,
    ),
  ).toBe(false);
});

test("one job list exposes approve, reject, hide and restore actions with persisted visibility", async ({
  page,
}, info) => {
  await login(page, "admin_demo");
  await page.evaluate(() => {
    localStorage.setItem(
      "guardianwork_company_members_24_0312345678",
      JSON.stringify({
        members: [{ id: "hr", name: "Thu Hà" }],
        grants: [],
        applications: [],
        jobs: [
          {
            id: "new-sales",
            authorId: "hr",
            title: "Nhân viên kinh doanh",
            companyName: "Minh An",
            department: "Kinh doanh",
            location: "Hà Nội",
            salary: "15 – 20 triệu",
            status: "Active",
            moderationStatus: "pending",
            created: "2026-10-21T08:00:00Z",
          },
          {
            id: "legacy-hr",
            authorId: "hr",
            title: "Chuyên viên nhân sự",
            companyName: "Minh An",
            department: "Nhân sự",
            location: "HCM",
            salary: "20 – 25 triệu",
            status: "Active",
            created: "2026-10-20T08:00:00Z",
          },
        ],
      }),
    );
  });
  await page.goto("/admin/jobs");
  await expect(
    page.getByRole("button", { name: "Duyệt tin Nhân viên kinh doanh", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Từ chối tin Nhân viên kinh doanh", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Ẩn tin Chuyên viên nhân sự", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: `/tmp/guardian-unified-jobs-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Duyệt tin Nhân viên kinh doanh", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ẩn tin Nhân viên kinh doanh", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ẩn tin Chuyên viên nhân sự", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xác nhận ẩn tin" })).toBeDisabled();
  await page.getByLabel("Lý do ẩn tin").fill("Cần kiểm tra thông tin tuyển dụng.");
  await page.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ẩn tin Chuyên viên nhân sự", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ẩn tin Chuyên viên nhân sự", exact: true }).click();
  await page.getByLabel("Lý do ẩn tin").fill("Cần kiểm tra thông tin tuyển dụng.");
  await page.getByRole("button", { name: "Xác nhận ẩn tin" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /^Đã ẩn/ }).click();
  await expect(page.locator(".approval-list li")).toHaveCount(1);
  await page.reload();
  await page.getByRole("button", { name: /^Đã ẩn/ }).click();
  await page
    .getByRole("button", { name: "Công khai lại Chuyên viên nhân sự", exact: true })
    .click();
  await page.getByLabel("Lý do công khai lại").fill("Đã xác minh nội dung tuyển dụng.");
  await page.getByRole("button", { name: "Xác nhận công khai lại" }).click();
  await page.getByRole("button", { name: /^Đang công khai/ }).click();
  await expect(page.locator(".approval-list li")).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
});
