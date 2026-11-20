import { test, expect, login } from "./fixtures";
import { staffJobApi } from "./helpers/staff-job-api";
const origin = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";

test("long staff job details scroll inside the workspace without moving the document", async ({
  page,
}) => {
  const api = await staffJobApi(page);
  api.review.content.description = "Kiểm tra chứng từ và lập báo cáo tài chính.\n".repeat(150);
  await login(page, "admin_demo");
  await page.goto(`${origin}/staff/jobs/91`);
  await expect(
    page.getByRole("heading", { name: api.review.content.title, exact: true }),
  ).toBeVisible();
  const main = page.locator("#workspace-main");
  await expect(main).toHaveJSProperty("clientHeight", 940);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
    1000,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  await expect(main).toHaveCSS("position", "relative");
  await expect(main).toHaveCSS("overscroll-behavior-y", "contain");
  await main.hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => main.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await main.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await page.mouse.wheel(0, 5000);
  expect(await page.evaluate(() => document.scrollingElement?.scrollTop)).toBe(0);
  expect(await page.locator("header").evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
});
