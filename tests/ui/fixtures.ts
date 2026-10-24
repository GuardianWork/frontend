import { test as base, expect, type Page } from "@playwright/test";
import { createMockApiServer } from "../../scripts/mock-api.mjs";

export const test = base.extend<{ mockApiUrl: string }>({
  mockApiUrl: async ({ browserName: _browserName }, provide) => {
    const server = createMockApiServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Mock API did not start");
    try {
      await provide(`http://127.0.0.1:${address.port}`);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
  page: async ({ page, mockApiUrl }, provide) => {
    // Never write test registrations or company decisions to a real backend.
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({ url: `${mockApiUrl}${url.pathname}${url.search}` });
      await route.fulfill({ response });
    });
    await provide(page);
  },
});
export { expect };

export async function login(page: Page, username: string, recruiter = false) {
  const loginUrl =
    username === "admin_demo"
      ? `${process.env.STAFF_UI_BASE_URL || "http://localhost:5138"}/login`
      : `/login?role=${recruiter ? "recruiter" : "candidate"}`;
  await page.goto(loginUrl, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("#login-identifier").fill(username);
  await page.locator("#login-password").fill("Guardian123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("main h1, main h2").first()).toBeVisible();
}

export async function auditInputs(page: Page, routes: string[]) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const report = [];
  for (const route of routes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    const inputs = page.locator("main input, main textarea");
    let checked = 0;
    let readonly = 0;
    for (let index = 0; index < (await inputs.count()); index++) {
      const input = inputs.nth(index);
      if (!(await input.isVisible())) continue;
      if (!(await input.isEnabled()) || (await input.getAttribute("readonly")) !== null) {
        readonly++;
        continue;
      }
      const type = (await input.getAttribute("type")) || "text";
      if (["radio", "checkbox", "file", "hidden", "submit"].includes(type)) continue;
      const value =
        type === "email"
          ? "nhap_lieu@example.test"
          : type === "url"
            ? "https://example.test/document.pdf"
            : "Kiểm tra nhập liệu tiếng Việt";
      await input.fill(value);
      await input.press("Tab");
      await expect(input).toHaveValue(value);
      checked++;
    }
    const overflow = await page.evaluate(() => {
      const main = document.querySelector("main");
      return (
        document.documentElement.scrollWidth > innerWidth + 1 ||
        Boolean(main && main.scrollWidth > main.clientWidth + 1)
      );
    });
    expect.soft(overflow, `Horizontal page overflow at ${route}`).toBe(false);
    report.push({ route, checked, readonly });
  }
  expect(errors).toEqual([]);
  return report;
}
