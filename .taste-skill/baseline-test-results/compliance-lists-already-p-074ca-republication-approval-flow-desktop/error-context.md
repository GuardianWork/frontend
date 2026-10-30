# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: compliance.spec.ts >> lists already-published flagged JDs without a prepublication approval flow
- Location: tests/ui/compliance.spec.ts:9:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Tin tuyển dụng cần kiểm tra' })
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Tin tuyển dụng cần kiểm tra' }) with timeout 7000ms
  - waiting for getByRole('heading', { name: 'Tin tuyển dụng cần kiểm tra' })

```

```yaml
- complementary:
  - strong: GuardianWork
  - paragraph: Platform staff
  - navigation "Điều hướng chính":
    - link "Tổng quan":
      - /url: /staff
    - link "Xác minh công ty":
      - /url: /staff/verifications
    - link "Quản lý tin tuyển dụng":
      - /url: /staff/jobs
    - link "Báo cáo vi phạm":
      - /url: /staff/reports
    - link "Quản lý tài khoản":
      - /url: /staff/accounts
  - link "Trang chủ GuardianWork":
    - /url: http://localhost:5139/vn
- banner:
  - paragraph: Quản lý tin tuyển dụng
  - button "Thông tin tài khoản Nguyễn Quản trị":
    - strong: Nguyễn Quản trị
    - text: admin@example.test
  - button "Đăng xuất"
- main:
  - heading "Quản lý tin tuyển dụng" [level=1]
  - paragraph: Duyệt tin chờ đăng, quản lý hiển thị và kiểm tra các nội dung AI gắn cờ.
  - text: Dữ liệu minh họa
  - note:
    - paragraph: Tin tuyển dụng và kết quả AI là dữ liệu mẫu. Thao tác duyệt, từ chối và thay đổi hiển thị chỉ áp dụng trong màn hình này, chưa ghi lên hệ thống.
  - region "Tin tuyển dụng gần đây":
    - heading "Tin tuyển dụng gần đây" [level=2]
    - paragraph: 7 tin · 2 chờ duyệt · 2 tin công khai chưa xử lý
    - text: Tìm tin, doanh nghiệp hoặc dấu hiệu AI
    - searchbox "Tìm tin, doanh nghiệp hoặc dấu hiệu AI"
    - status: 7 kết quả
    - text: Mức ưu tiên
    - combobox "Mức ưu tiên":
      - option "Tất cả" [selected]
      - option "Ưu tiên cao"
      - option "Cần xem xét"
      - option "Chưa có kết quả AI"
    - text: Trạng thái
    - combobox "Trạng thái":
      - option "Tất cả" [selected]
      - option "Chờ duyệt"
      - option "Đang công khai"
      - option "Đã từ chối"
      - option "Công khai · Chưa xử lý"
      - option "Đã xem xét"
      - option "Đã ẩn"
    - table "Danh sách tin tuyển dụng":
      - caption: Danh sách tin tuyển dụng
      - rowgroup:
        - row "Tin tuyển dụng AI phát hiện Ưu tiên Trạng thái Ngày gửi Thao tác":
          - columnheader "Tin tuyển dụng"
          - columnheader "AI phát hiện"
          - columnheader "Ưu tiên"
          - columnheader "Trạng thái"
          - columnheader "Ngày gửi"
          - columnheader "Thao tác"
      - rowgroup:
        - row "Chuyên viên chăm sóc khách hàng Bình Minh Retail JD-1050 · Dịch vụ khách hàng Chưa có kết quả quét AI Chưa có kết quả Chờ duyệt 08:00 24/10/2026 Xem chi tiết Chuyên viên chăm sóc khách hàng":
          - cell "Chuyên viên chăm sóc khách hàng Bình Minh Retail JD-1050 · Dịch vụ khách hàng":
            - button "Chuyên viên chăm sóc khách hàng"
            - text: Bình Minh Retail JD-1050 · Dịch vụ khách hàng
          - cell "Chưa có kết quả quét AI":
            - text: Chưa có kết quả quét AI
            - list
          - cell "Chưa có kết quả"
          - cell "Chờ duyệt"
          - cell "08:00 24/10/2026":
            - time: 08:00 24/10/2026
          - cell "Xem chi tiết Chuyên viên chăm sóc khách hàng":
            - button "Xem chi tiết Chuyên viên chăm sóc khách hàng": Xem chi tiết
        - row "Chuyên viên marketing Hòa Bình Foods JD-1049 · Marketing Chưa có kết quả quét AI Chưa có kết quả Chờ duyệt 07:30 24/10/2026 Xem chi tiết Chuyên viên marketing":
          - cell "Chuyên viên marketing Hòa Bình Foods JD-1049 · Marketing":
            - button "Chuyên viên marketing"
            - text: Hòa Bình Foods JD-1049 · Marketing
          - cell "Chưa có kết quả quét AI":
            - text: Chưa có kết quả quét AI
            - list
          - cell "Chưa có kết quả"
          - cell "Chờ duyệt"
          - cell "07:30 24/10/2026":
            - time: 07:30 24/10/2026
          - cell "Xem chi tiết Chuyên viên marketing":
            - button "Xem chi tiết Chuyên viên marketing": Xem chi tiết
        - row "Nhân viên nhập liệu Nam Việt Services JD-1048 · Hành chính Chưa có kết quả quét AI Chưa có kết quả Đã từ chối 09:00 23/10/2026 Xem chi tiết Nhân viên nhập liệu":
          - cell "Nhân viên nhập liệu Nam Việt Services JD-1048 · Hành chính":
            - button "Nhân viên nhập liệu"
            - text: Nam Việt Services JD-1048 · Hành chính
          - cell "Chưa có kết quả quét AI":
            - text: Chưa có kết quả quét AI
            - list
          - cell "Chưa có kết quả"
          - cell "Đã từ chối"
          - cell "09:00 23/10/2026":
            - time: 09:00 23/10/2026
          - cell "Xem chi tiết Nhân viên nhập liệu":
            - button "Xem chi tiết Nhân viên nhập liệu": Xem chi tiết
        - row "Kế toán công nợ An Phúc Retail JD-1042 · Kế toán · Tài chính Yêu cầu đặt cọc Giữ giấy tờ gốc Ưu tiên cao Đang công khai Chưa xử lý 08:00 19/10/2026 Xem chi tiết Kế toán công nợ":
          - cell "Kế toán công nợ An Phúc Retail JD-1042 · Kế toán · Tài chính":
            - button "Kế toán công nợ"
            - text: An Phúc Retail JD-1042 · Kế toán · Tài chính
          - cell "Yêu cầu đặt cọc Giữ giấy tờ gốc":
            - list:
              - listitem: Yêu cầu đặt cọc
              - listitem: Giữ giấy tờ gốc
          - cell "Ưu tiên cao"
          - cell "Đang công khai Chưa xử lý"
          - cell "08:00 19/10/2026":
            - time: 08:00 19/10/2026
          - cell "Xem chi tiết Kế toán công nợ":
            - button "Xem chi tiết Kế toán công nợ": Xem chi tiết
        - row "Chuyên viên tuyển dụng Mộc Lan Foods JD-1039 · Nhân sự Điều kiện cá nhân Cần xem xét Đang công khai Chưa xử lý 14:30 18/10/2026 Xem chi tiết Chuyên viên tuyển dụng":
          - cell "Chuyên viên tuyển dụng Mộc Lan Foods JD-1039 · Nhân sự":
            - button "Chuyên viên tuyển dụng"
            - text: Mộc Lan Foods JD-1039 · Nhân sự
          - cell "Điều kiện cá nhân":
            - list:
              - listitem: Điều kiện cá nhân
          - cell "Cần xem xét"
          - cell "Đang công khai Chưa xử lý"
          - cell "14:30 18/10/2026":
            - time: 14:30 18/10/2026
          - cell "Xem chi tiết Chuyên viên tuyển dụng":
            - button "Xem chi tiết Chuyên viên tuyển dụng": Xem chi tiết
        - row "Nhân viên bán hàng Đông Dương Home JD-1027 · Bán lẻ · Kinh doanh Tiền lương tăng ca Ưu tiên cao Đã ẩn 09:00 16/10/2026 Xem chi tiết Nhân viên bán hàng":
          - cell "Nhân viên bán hàng Đông Dương Home JD-1027 · Bán lẻ · Kinh doanh":
            - button "Nhân viên bán hàng"
            - text: Đông Dương Home JD-1027 · Bán lẻ · Kinh doanh
          - cell "Tiền lương tăng ca":
            - list:
              - listitem: Tiền lương tăng ca
          - cell "Ưu tiên cao"
          - cell "Đã ẩn"
          - cell "09:00 16/10/2026":
            - time: 09:00 16/10/2026
          - cell "Xem chi tiết Nhân viên bán hàng":
            - button "Xem chi tiết Nhân viên bán hàng": Xem chi tiết
        - row "Điều phối vận tải Minh An Logistics JD-1018 · Vận hành · Logistics Thời gian thử việc Cần xem xét Đang công khai Đã xem xét 10:00 15/10/2026 Xem chi tiết Điều phối vận tải":
          - cell "Điều phối vận tải Minh An Logistics JD-1018 · Vận hành · Logistics":
            - button "Điều phối vận tải"
            - text: Minh An Logistics JD-1018 · Vận hành · Logistics
          - cell "Thời gian thử việc":
            - list:
              - listitem: Thời gian thử việc
          - cell "Cần xem xét"
          - cell "Đang công khai Đã xem xét"
          - cell "10:00 15/10/2026":
            - time: 10:00 15/10/2026
          - cell "Xem chi tiết Điều phối vận tải":
            - button "Xem chi tiết Điều phối vận tải": Xem chi tiết
    - navigation "Phân trang tin tuyển dụng":
      - status:
        - strong: 1–7
        - text: / 7 JD
      - button "Trang trước" [disabled]: Trước
      - button "Trang 1" [disabled]: "1"
      - button "Trang sau" [disabled]: Sau
    - paragraph: Dấu hiệu do AI gắn cờ cần được kiểm tra cùng toàn bộ JD trước khi xử lý tin.
```

# Test source

```ts
  1  | import { test, expect, login } from "./fixtures";
  2  | 
  3  | test.beforeEach(async ({ page }) => {
  4  |   await login(page, "admin_demo");
  5  |   await page.goto("/admin/compliance", { waitUntil: "domcontentloaded" });
> 6  |   await expect(page.getByRole("heading", { name: "Tin tuyển dụng cần kiểm tra" })).toBeVisible();
     |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  7  | });
  8  | 
  9  | test("lists already-published flagged JDs without a prepublication approval flow", async ({
  10 |   page,
  11 | }) => {
  12 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(4);
  13 |   await expect(page.getByRole("searchbox")).toHaveCount(1);
  14 |   await expect(page.locator("textarea")).toHaveCount(0);
  15 |   await expect(
  16 |     page.getByRole("button", { name: /Phê duyệt|Duyệt tin|Rà soát nội dung|Điền nội dung mẫu/ }),
  17 |   ).toHaveCount(0);
  18 |   await expect(page.getByText("Dữ liệu minh họa", { exact: true })).toBeVisible();
  19 |   await expect(page.getByText("4 JD được gắn cờ · 2 tin công khai chưa xử lý")).toBeVisible();
  20 |   expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
  21 |     false,
  22 |   );
  23 | });
  24 | 
  25 | test("combines Vietnamese search, priority and handling filters, with empty-state recovery", async ({
  26 |   page,
  27 | }) => {
  28 |   await page.getByRole("searchbox").fill("ke toan");
  29 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  30 |   await expect(page.getByRole("button", { name: "Kế toán công nợ", exact: true })).toBeVisible();
  31 |   await page.getByRole("button", { name: "Xóa từ khóa tìm kiếm" }).click();
  32 |   await page.getByRole("combobox", { name: /Mức ưu tiên/ }).selectOption("HIGH");
  33 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(2);
  34 |   await page.getByRole("combobox", { name: /^Xử lý/ }).selectOption("OPEN");
  35 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  36 |   await page.getByRole("searchbox").fill("không tồn tại");
  37 |   await expect(page.getByRole("heading", { name: "Không có JD phù hợp" })).toBeVisible();
  38 |   await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  39 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(4);
  40 | });
  41 | 
  42 | test("opens full published JD and findings, then restores filters and keyboard focus", async ({
  43 |   page,
  44 | }) => {
  45 |   await page.getByRole("searchbox").fill("JD-1042");
  46 |   await page.getByRole("button", { name: "Kế toán công nợ", exact: true }).click();
  47 |   await expect(page.getByRole("heading", { name: "Kế toán công nợ", exact: true })).toBeFocused();
  48 |   await expect(page.getByRole("heading", { name: "Nội dung JD đã đăng" })).toBeVisible();
  49 |   await expect(page.getByText("Đã đăng lúc", { exact: true })).toBeVisible();
  50 |   await expect(page.getByRole("heading", { name: "Dấu hiệu AI phát hiện" })).toBeVisible();
  51 |   await expect(page.locator(".compliance-finding-list blockquote")).toHaveCount(2);
  52 |   await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  53 |   await expect(page.getByRole("searchbox")).toHaveValue("JD-1042");
  54 |   await expect(page.getByRole("button", { name: "Kế toán công nợ", exact: true })).toBeFocused();
  55 | });
  56 | 
  57 | test("hides a published job only after a reason and preserves history when restoring it", async ({
  58 |   page,
  59 | }) => {
  60 |   await page.getByRole("button", { name: "Xem JD Kế toán công nợ", exact: true }).click();
  61 |   await page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true }).click();
  62 |   await page.locator("#compliance-action-reason").fill("   ");
  63 |   await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  64 |   await expect(page.getByRole("alert")).toContainText("Nhập lý do");
  65 |   await page
  66 |     .locator("#compliance-action-reason")
  67 |     .fill("Cần kiểm tra khoản đặt cọc được ghi trong JD.");
  68 |   await page.getByRole("button", { name: "Xác nhận ẩn tin", exact: true }).click();
  69 |   await expect(page.getByRole("dialog")).not.toBeVisible();
  70 |   await expect(page.getByRole("button", { name: "Công khai lại tin", exact: true })).toBeVisible();
  71 |   await expect(page.getByRole("heading", { name: "Lịch sử xử lý" })).toBeVisible();
  72 |   await expect(
  73 |     page.getByText("Cần kiểm tra khoản đặt cọc được ghi trong JD.", { exact: true }),
  74 |   ).toBeVisible();
  75 |   await page.getByRole("button", { name: "Công khai lại tin", exact: true }).click();
  76 |   await page
  77 |     .locator("#compliance-action-reason")
  78 |     .fill("Đã kiểm tra nội dung và ghi nhận kết quả xem xét.");
  79 |   await page.getByRole("button", { name: "Xác nhận công khai lại", exact: true }).click();
  80 |   await expect(page.getByRole("button", { name: "Ẩn tin đã đăng", exact: true })).toBeVisible();
  81 |   await expect(page.getByRole("button", { name: "Đã xem xét", exact: true })).toBeDisabled();
  82 |   await expect(page.locator(".compliance-history li")).toHaveCount(2);
  83 | });
  84 | 
  85 | test("reviewing keeps the published job visible and updates the outstanding queue", async ({
  86 |   page,
  87 | }) => {
  88 |   await page.getByRole("combobox", { name: /^Xử lý/ }).selectOption("OPEN");
  89 |   await page.getByRole("button", { name: "Xem JD Kế toán công nợ", exact: true }).click();
  90 |   await page.getByRole("button", { name: "Đánh dấu đã xem xét", exact: true }).click();
  91 |   await expect(page.getByRole("button", { name: "Đã xem xét", exact: true })).toBeDisabled();
  92 |   await expect(page.locator(".compliance-jd .compliance-visibility")).toHaveText("Đang công khai");
  93 |   await page.getByRole("button", { name: "Quay lại danh sách", exact: true }).click();
  94 |   await expect(page.locator(".compliance-table tbody tr")).toHaveCount(1);
  95 |   await expect(page.getByText("4 JD được gắn cờ · 1 tin công khai chưa xử lý")).toBeVisible();
  96 |   await expect(page.locator("#compliance-list-title")).toBeFocused();
  97 | });
  98 | 
```