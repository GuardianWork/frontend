# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inputs.spec.ts >> all registration fields retain input and password errors preserve the form
- Location: tests/ui/inputs.spec.ts:26:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#register-fullName')
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('#register-fullName') with timeout 7000ms
  - waiting for locator('#register-fullName')

```

```yaml
- banner:
  - link "GuardianWork":
    - /url: /vn
  - text: Đã có tài khoản?
  - link "Đăng nhập":
    - /url: /login?role=recruiter
- main:
  - link "Về trang chủ":
    - /url: /vn
  - heading "Đội ngũ vững mạnh. Bắt đầu từ bạn." [level=1]
  - paragraph: Xây dựng hồ sơ doanh nghiệp, đăng tin tuyển dụng và kết nối với những ứng viên phù hợp trên GuardianWork.
  - paragraph: Quản lý tin tuyển dụng trong một không gian
  - paragraph: Theo dõi ứng viên và tiến độ tuyển dụng
  - paragraph: Xác thực thông tin, xây dựng uy tín công ty
  - region "Biểu mẫu đăng ký":
    - heading "Tạo tài khoản của bạn" [level=2]
    - paragraph: Một tài khoản cho cả tìm việc và tuyển dụng. Lựa chọn bên dưới chỉ chọn không gian sau khi đăng nhập.
    - group "Bạn muốn làm gì tiếp theo?":
      - text: Bạn muốn làm gì tiếp theo?
      - radio "Tôi muốn tìm việc Khám phá cơ hội mới"
      - text: Tôi muốn tìm việc Khám phá cơ hội mới
      - radio "Tôi muốn tuyển dụng Bắt đầu tuyển dụng" [checked]
      - text: Tôi muốn tuyển dụng Bắt đầu tuyển dụng
    - paragraph: Tạo tài khoản trước. Sau khi đăng nhập, bạn có thể thiết lập hồ sơ công ty hoặc chấp nhận lời mời tham gia công ty.
    - group:
      - text: Họ và tên đệm
      - textbox "Họ và tên đệm":
        - /placeholder: Nguyễn Văn
        - text: Nguyễn Văn
      - text: Tên
      - textbox "Tên":
        - /placeholder: An
        - text: An
      - text: Tên đăng nhập
      - textbox "Tên đăng nhập":
        - /placeholder: nguyen_van_an
        - text: nguyen_van_an
      - paragraph: "3–50 ký tự: chữ không dấu, số, dấu gạch dưới."
      - text: Email tài khoản
      - textbox "Email tài khoản":
        - /placeholder: ban@email.com
        - text: an@example.test
      - text: Mật khẩu
      - textbox "Mật khẩu": Guardian123!
      - button "Hiện mật khẩu"
      - paragraph: 8–128 ký tự, bao gồm chữ hoa, chữ thường và số.
      - text: Xác nhận mật khẩu
      - textbox "Xác nhận mật khẩu": Other123!
      - button "Hiện xác nhận mật khẩu"
      - button "Đăng ký tuyển dụng"
    - paragraph:
      - text: Đã có tài khoản?
      - link "Đăng nhập":
        - /url: /login?role=recruiter
- contentinfo: © GuardianWork Kết nối sự nghiệp, xây dựng niềm tin.
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | test("login hydrates and accepts typing, purpose selection, and password visibility", async ({
  4  |   page,
  5  | }) => {
  6  |   const errors: string[] = [];
  7  |   page.on("pageerror", (error) => errors.push(error.message));
  8  |   await page.goto("/login", { waitUntil: "domcontentloaded" });
  9  |   const identifier = page.locator("#login-identifier");
  10 |   await expect(identifier).toBeEnabled();
  11 |   await identifier.click();
  12 |   await identifier.pressSequentially("candidate_demo");
  13 |   await expect(identifier).toHaveValue("candidate_demo");
  14 |   await page.locator("#login-password").fill("Guardian123!");
  15 |   await page.getByRole("button", { name: "Hiện mật khẩu", exact: true }).click();
  16 |   await expect(page.locator("#login-password")).toHaveAttribute("type", "text");
  17 |   await page
  18 |     .locator("label")
  19 |     .filter({ has: page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ }) })
  20 |     .click();
  21 |   await expect(page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ })).toBeChecked();
  22 |   await expect(identifier).toHaveValue("candidate_demo");
  23 |   expect(errors).toEqual([]);
  24 | });
  25 | 
  26 | test("all registration fields retain input and password errors preserve the form", async ({
  27 |   page,
  28 | }) => {
  29 |   await page.goto("/register", { waitUntil: "domcontentloaded" });
  30 |   const values = {
  31 |     "register-last-name": "Nguyễn Văn",
  32 |     "register-first-name": "An",
  33 |     "register-username": "nguyen_van_an",
  34 |     "register-email": "an@example.test",
  35 |     "register-password": "Guardian123!",
  36 |     "register-confirmation": "Other123!",
  37 |   };
  38 |   for (const [id, value] of Object.entries(values)) {
  39 |     const input = page.locator(`#${id}`);
  40 |     await expect(input).toBeEnabled();
  41 |     await input.fill(value);
  42 |     await expect(input).toHaveValue(value);
  43 |   }
  44 |   await page.getByRole("button", { name: "Đăng ký tìm việc", exact: true }).click();
  45 |   await expect(page.getByRole("alert")).toContainText("Mật khẩu xác nhận chưa khớp");
  46 |   await expect(page.locator("#register-confirmation")).toBeFocused();
  47 |   await expect(page.locator("#register-first-name")).toHaveValue("An");
  48 |   await page
  49 |     .locator("label")
  50 |     .filter({ has: page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ }) })
  51 |     .click();
> 52 |   await expect(page.locator("#register-fullName")).toBeVisible();
     |                                                    ^ Error: expect(locator).toBeVisible() failed
  53 |   await expect(page.locator("#register-username")).toHaveCount(0);
  54 |   await page
  55 |     .locator("label")
  56 |     .filter({ has: page.getByRole("radio", { name: /Tôi muốn tìm việc/ }) })
  57 |     .click();
  58 |   await expect(page.locator("#register-username")).toHaveValue("nguyen_van_an");
  59 | });
  60 | 
```