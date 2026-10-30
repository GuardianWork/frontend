import { expect, test } from "@playwright/test";

test("login hydrates and accepts typing, purpose selection, and password visibility", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const identifier = page.locator("#login-identifier");
  await expect(identifier).toBeEnabled();
  await identifier.click();
  await identifier.pressSequentially("candidate_demo");
  await expect(identifier).toHaveValue("candidate_demo");
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Hiện mật khẩu", exact: true }).click();
  await expect(page.locator("#login-password")).toHaveAttribute("type", "text");
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ }) })
    .click();
  await expect(page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ })).toBeChecked();
  await expect(identifier).toHaveValue("candidate_demo");
  expect(errors).toEqual([]);
});

test("all registration fields retain input and password errors preserve the form", async ({
  page,
}) => {
  await page.goto("/register", { waitUntil: "domcontentloaded" });
  const values = {
    "register-last-name": "Nguyễn Văn",
    "register-first-name": "An",
    "register-username": "nguyen_van_an",
    "register-email": "an@example.test",
    "register-password": "Guardian123!",
    "register-confirmation": "Other123!",
  };
  for (const [id, value] of Object.entries(values)) {
    const input = page.locator(`#${id}`);
    await expect(input).toBeEnabled();
    await input.fill(value);
    await expect(input).toHaveValue(value);
  }
  await page.getByRole("button", { name: "Đăng ký tìm việc", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Mật khẩu xác nhận chưa khớp");
  await expect(page.locator("#register-confirmation")).toBeFocused();
  await expect(page.locator("#register-first-name")).toHaveValue("An");
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: /Tôi muốn tuyển dụng/ }) })
    .click();
  await expect(page.locator("#register-fullName")).toBeVisible();
  await expect(page.locator("#register-username")).toHaveCount(0);
  await page
    .locator("label")
    .filter({ has: page.getByRole("radio", { name: /Tôi muốn tìm việc/ }) })
    .click();
  await expect(page.locator("#register-username")).toHaveValue("nguyen_van_an");
});
