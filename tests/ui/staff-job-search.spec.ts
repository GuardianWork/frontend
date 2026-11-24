import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";

const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

test("Staff searches job titles and company names across pages and preserves the search on detail return", async ({
  page,
}, info) => {
  const api = await staffJobApi(page);
  const rows = Array.from({ length: 25 }, (_, index) => ({
    ...api.review,
    id: 91 + index,
    content: {
      ...api.review.content,
      title: index === 0 ? "Chuyên viên kế toán" : `Chuyên viên kinh doanh ${index}`,
    },
    companyName: index === 0 ? "Công ty Ánh Dương" : "Công ty Đại Phát",
  }));
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const requests: string[] = [];
  await page.route(/\/api\/staff\/job-revisions(?:\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get("q") || "";
    requests.push(q);
    const status = url.searchParams.get("status");
    const filtered = rows.filter(
      (row) =>
        (status === "ALL" || status === row.state) &&
        (!q ||
          normalize(row.content.title).includes(normalize(q)) ||
          normalize(row.companyName).includes(normalize(q))),
    );
    const sourcePage = Number(url.searchParams.get("page") || 0);
    return route.fulfill({
      json: {
        data: {
          content: filtered.slice(sourcePage * 20, (sourcePage + 1) * 20),
          pageNumber: sourcePage,
          pageSize: 20,
          totalElements: filtered.length,
          totalPages: Math.ceil(filtered.length / 20),
        },
      },
    });
  });
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs?page=1`);
  const input = page.getByRole("searchbox", { name: "Tìm theo tên việc làm hoặc tên công ty" });
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(5);
  await input.fill("ke toan");
  await expect(page).toHaveURL(/q=ke(?:\+|%20)toan/);
  expect(new URL(page.url()).searchParams.has("page")).toBe(false);
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(1);
  await expect(page.getByRole("columnheader", { name: /Tên công ty/ })).toBeVisible();
  await expect(page.locator(".staff-jobs-company")).toHaveText("Công ty Ánh Dương");
  await input.fill("anh duong");
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(1);
  await expect.poll(() => requests.at(-1)).toBe("anh duong");
  await page.screenshot({
    path: info.outputPath("staff-job-search-desktop.png"),
    animations: "disabled",
  });
  await page.getByRole("link", { name: "Xem chi tiết Chuyên viên kế toán", exact: true }).click();
  await expect(page).toHaveURL(/\/staff\/jobs\/91\?q=anh(?:\+|%20)duong/);
  await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  await expect(input).toHaveValue("anh duong");
  await page.reload();
  await expect(input).toHaveValue("anh duong");
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("APPROVED");
  await expect(page.getByRole("heading", { name: "Không tìm thấy tin tuyển dụng" })).toBeVisible();
  await expect(input).toHaveValue("anh duong");
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("ALL");
  await expect(page.locator(".staff-jobs-company")).toHaveText("Công ty Ánh Dương");
  await input.fill("không có kết quả");
  await expect(page.getByRole("heading", { name: "Không tìm thấy tin tuyển dụng" })).toBeVisible();
  await input.fill("");
  await expect(page.locator(".staff-jobs-table tbody tr")).toHaveCount(20);
});
