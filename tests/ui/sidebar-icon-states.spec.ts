import { test, expect, login } from "./fixtures";

for (const [role, username, recruiter] of [
  ["candidate", "candidate_demo", false],
  ["recruiter", "owner_demo", true],
  ["staff", "admin_demo", false],
] as const) {
  test(`${role} sidebar icons stay unfilled while hovering and pressing`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await login(page, username, recruiter);
    const links = page.locator(".workspace-navigation a.workspace-nav-link");
    // Check current and other destinations without triggering navigation on mouse release.
    for (const link of [
      page.locator('.workspace-navigation a.workspace-nav-link[aria-current="page"]').first(),
      page.locator('.workspace-navigation a.workspace-nav-link:not([aria-current="page"])').first(),
    ]) {
      await expect(link).toBeVisible();
      const icon = link.locator(".workspace-nav-icon");
      await link.hover();
      await expect(icon).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await page.mouse.down();
      await expect(icon).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      expect(
        await icon.evaluate(
          (node) => getComputedStyle(node).color === getComputedStyle(node.parentElement!).color,
        ),
      ).toBe(true);
      await page.screenshot({ path: `/tmp/gw-sidebar-${role}-pressed.png` });
      await page.mouse.move(1430, 990);
      await page.mouse.up();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /Mở (menu|điều hướng)/ }).click();
    await expect(links.first().locator(".workspace-nav-icon")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    );
    await page.screenshot({ path: `/tmp/gw-sidebar-${role}-mobile.png` });
  });
}
