import { expect, test, login } from "./fixtures";
import type { Page } from "@playwright/test";

const SECTION_TITLES = ["Giới thiệu bản thân", "Kinh nghiệm làm việc", "Học vấn", "Kỹ năng"];

async function sectionOrder(page: Page) {
  const titles = await page
    .locator("main section h2")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim() ?? ""));
  return titles.filter((title) => SECTION_TITLES.includes(title));
}

test.describe("candidate profile sections", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "candidate_demo");
    await page.goto("/can/profile", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => localStorage.removeItem("guardianwork.profile-section-order"));
    await page.reload({ waitUntil: "networkidle" });
  });

  test("reorders sections with the keyboard and restores the saved order", async ({ page }) => {
    expect(await sectionOrder(page)).toEqual(SECTION_TITLES);

    const handle = page.getByRole("button", { name: "Sắp xếp mục Kỹ năng" });
    await handle.scrollIntoViewIfNeeded();
    await handle.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(250);
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(250);
    await page.keyboard.press("Space");
    await page.waitForTimeout(250);

    expect(await sectionOrder(page)).toEqual([
      "Giới thiệu bản thân",
      "Kinh nghiệm làm việc",
      "Kỹ năng",
      "Học vấn",
    ]);
    expect(
      await page.evaluate(() => localStorage.getItem("guardianwork.profile-section-order")),
    ).toBe(JSON.stringify(["about", "experience", "skills", "education"]));

    await page.reload({ waitUntil: "networkidle" });
    expect(await sectionOrder(page)).toEqual([
      "Giới thiệu bản thân",
      "Kinh nghiệm làm việc",
      "Kỹ năng",
      "Học vấn",
    ]);
  });

  test("keeps a dedicated drag handle per section", async ({ page }) => {
    await expect(page.getByRole("button", { name: /^Sắp xếp mục / })).toHaveCount(4);
  });
});
