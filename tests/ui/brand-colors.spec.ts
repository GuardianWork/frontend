import { test, expect, login } from "./fixtures";

test("GuardianWork logos are blue across desktop surfaces", async ({ page }) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const blue = "rgb(37, 87, 167)";
  for (const [route, selector] of [
    ["/vn", ".career-brand__name"],
    ["/jobs", ".career-brand__symbol"],
    ["/login?role=candidate", ".guardian-logo"],
    ["/register?role=recruiter", ".guardian-logo"],
    ["/account-recovery", ".guardian-logo"],
    ["/company-invitations", ".guardian-logo"],
    ["http://localhost:5138/login", ".staff-login-brand"],
  ]) {
    await page.goto(route);
    await expect(page.locator(selector).first()).toHaveCSS("color", blue);
  }
  for (const [role, user, recruiter] of [
    ["candidate", "candidate_demo", false],
    ["recruiter", "owner_demo", true],
    ["staff", "admin_demo", false],
  ] as const) {
    await login(page, user, recruiter);
    await expect(page.locator(".workspace-header-brand")).toHaveCSS("color", blue);
    const shield = page
      .locator(
        ".workspace-sidebar .workspace-brand__identity svg, .workspace-sidebar .workspace-sidebar-brand svg",
      )
      .first();
    await expect(shield).toHaveCSS("color", "rgb(145, 186, 255)");
    await page.screenshot({ path: `/tmp/gw-blue-logo-${role}.png` });
  }
});
