import { test, expect, login } from "./fixtures";

test("Candidate entry, search, profile and account stay under /can", async ({ page }) => {
  await login(page, "candidate_demo");
  await expect(page).toHaveURL(/\/can\/jobs$/);
  await page.getByRole("textbox", { name: "Vị trí, kỹ năng hoặc công ty" }).fill("Kinh doanh");
  await page.locator(".career-search").getByRole("button").click();
  await expect(page).toHaveURL(/\/can\/jobs\?/);
  await page.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
  await expect(page).toHaveURL(/\/can\/profile/);
  await page.getByRole("link", { name: "Cài đặt tài khoản", exact: true }).first().click();
  await expect(page).toHaveURL(/\/can\/account$/);
  await expect(page.locator(".candidate-workspace")).toBeVisible();
});

test("Recruiter account keeps recruiter shell even before Company setup or email verification", async ({
  page,
  mockApiUrl,
}) => {
  await page.request.post(`${mockApiUrl}/api/auth/register`, {
    data: {
      firstName: "Linh",
      lastName: "Trần",
      username: "new_recruiter",
      email: "newrec@example.test",
      password: "Guardian123!",
    },
  });
  await login(page, "new_recruiter", true);
  await expect(page).toHaveURL(/\/rec\/verification$/);
  await page.getByRole("link", { name: "Cài đặt tài khoản", exact: true }).click();
  await expect(page).toHaveURL(/\/rec\/account$/);
  await expect(page.locator(".recruiter-workspace")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tên", exact: true })).toHaveValue("Linh");
  await expect(
    page.getByRole("heading", { name: "Xác minh email đã đăng ký", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".candidate-workspace")).toHaveCount(0);
});

test("legacy Candidate and recruiter deep links preserve query and hash when redirected", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  await page.goto("/candidate/jobs?q=Kinh%20doanh&location=H%C3%A0%20N%E1%BB%99i");
  await expect(page).toHaveURL(/\/can\/jobs\?/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("Kinh doanh");
  expect(new URL(page.url()).searchParams.get("location")).toBe("Hà Nội");
  await page.goto("/recruiter/verification#company");
  await expect(page).toHaveURL(/\/rec\/verification#company$/);
  await page.goto("/candidate/profile");
  await expect(page).toHaveURL(/\/can\/profile$/);
});

test("all USER workspaces keep the same three quick destinations, including phone navigation", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  for (const path of [
    "/can/jobs",
    "/can/profile",
    "/can/cvs",
    "/can/account",
    "/rec/account",
    "/rec/verification",
  ]) {
    await page.goto(path);
    const quick = page.getByRole("navigation", { name: "Điều hướng nhanh" });
    await expect(quick.getByRole("link")).toHaveCount(3);
    await expect(quick.getByRole("link").nth(0)).toHaveText("Cài đặt tài khoản");
    await expect(quick.getByRole("link").nth(1)).toContainText("Chuyển phân hệ");
    await expect(quick.getByRole("link").nth(2)).toHaveText("Trang chủ");
    await expect(quick.getByRole("link").nth(0)).toHaveAttribute(
      "href",
      path.startsWith("/rec") ? "/rec/account" : "/can/account",
    );
    await expect(quick.getByRole("link").nth(1)).toHaveAttribute(
      "href",
      path.startsWith("/rec") ? "/can/jobs" : "/rec",
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/can/account", "/rec/account"]) {
    await page.goto(path);
    await page
      .getByRole("button", {
        name: path.startsWith("/rec") ? "Mở menu" : "Mở điều hướng",
        exact: true,
      })
      .click();
    const quick = page.getByRole("navigation", { name: "Điều hướng nhanh" });
    await expect(quick).toBeVisible();
    await expect(quick.getByRole("link")).toHaveCount(3);
    await page.screenshot({
      path: `.impeccable/review/gw95-${path.startsWith("/rec") ? "recruiter" : "candidate"}-drawer-390.png`,
      animations: "disabled",
      fullPage: true,
    });
    await page.keyboard.press("Escape");
    await expect(quick).toBeHidden();
  }
});

test("recruiter settings reference captures remain within the recruiter workspace", async ({
  page,
}) => {
  await login(page, "recruiter_demo", true);
  await page.goto("/rec/account");
  await expect(page.getByRole("textbox", { name: "Tên", exact: true })).toHaveValue("Linh");
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    await page.locator("main").evaluate((el) => (el.scrollTop = 0));
    await page.screenshot({
      path: `.impeccable/review/gw95-recruiter-account-${width}.png`,
      animations: "disabled",
      fullPage: true,
    });
  }
});

test("sidebar and header DOM persist while Candidate navigation replaces only the main view", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  const sidebar = await page.locator(".workspace-sidebar").elementHandle();
  const header = await page.locator(".workspace-content > header").elementHandle();
  const main = await page.locator(".workspace-content > main").elementHandle();
  await page.evaluate(() => (document.documentElement.dataset.navigationMarker = "persistent"));
  let identityLoads = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/auth/me")) identityLoads++;
  });
  await page
    .getByRole("navigation", { name: "Điều hướng nhanh" })
    .getByRole("link", { name: "Cài đặt tài khoản", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Cài đặt tài khoản", exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Điều hướng chính", exact: true })
    .getByRole("link", { name: "Hồ sơ của tôi", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Hồ sơ cá nhân", exact: true })).toBeVisible();
  expect(await sidebar!.evaluate((el) => el === document.querySelector(".workspace-sidebar"))).toBe(
    true,
  );
  expect(
    await header!.evaluate((el) => el === document.querySelector(".workspace-content > header")),
  ).toBe(true);
  expect(
    await main!.evaluate((el) => el === document.querySelector(".workspace-content > main")),
  ).toBe(true);
  expect(await page.evaluate(() => document.documentElement.dataset.navigationMarker)).toBe(
    "persistent",
  );
  expect(identityLoads).toBe(0);
});

test("recruiter main-content navigation keeps the frame through Company setup and account settings", async ({
  page,
}) => {
  await login(page, "recruiter_demo", true);
  const sidebar = await page.locator(".workspace-sidebar").elementHandle();
  const header = await page.locator(".workspace-content > header").elementHandle();
  const main = await page.locator(".workspace-content > main").elementHandle();
  await page
    .getByRole("navigation", { name: "Điều hướng nhanh" })
    .getByRole("link", { name: "Cài đặt tài khoản", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Cài đặt tài khoản", exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Điều hướng nhà tuyển dụng" })
    .getByRole("link", { name: "Hồ sơ công ty", exact: true })
    .click();
  await expect(page).toHaveURL(/\/rec\/verification$/);
  expect(await sidebar!.evaluate((el) => el === document.querySelector(".workspace-sidebar"))).toBe(
    true,
  );
  expect(
    await header!.evaluate((el) => el === document.querySelector(".workspace-content > header")),
  ).toBe(true);
  expect(
    await main!.evaluate((el) => el === document.querySelector(".workspace-content > main")),
  ).toBe(true);
});

test("sidebar collapse is smooth, interruptible, retained across roles, and accessible as an icon rail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, "candidate_demo");
  await page.goto("/can/account");
  const sidebar = page.locator(".workspace-sidebar");
  await expect(sidebar).toHaveCSS("width", "244px");
  const original = await sidebar.elementHandle();
  const initialToggle = page.getByRole("button", { name: "Thu gọn thanh điều hướng", exact: true });
  await expect(initialToggle).toHaveCSS("width", "44px");
  await expect(initialToggle).toHaveCSS("height", "44px");
  await initialToggle.click();
  const widths = await sidebar.evaluate(
    (el) =>
      new Promise<number[]>((resolve) => {
        const values: number[] = [];
        const start = performance.now();
        function tick() {
          values.push(el.getBoundingClientRect().width);
          if (performance.now() - start < 350) requestAnimationFrame(tick);
          else resolve(values);
        }
        requestAnimationFrame(tick);
      }),
  );
  expect(widths.some((width) => width > 80 && width < 240)).toBe(true);
  await expect(sidebar).toHaveCSS("width", "76px");
  await expect(
    page.getByRole("button", { name: "Mở rộng thanh điều hướng", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
  const profile = page
    .getByRole("navigation", { name: "Điều hướng chính", exact: true })
    .getByRole("link", { name: "Hồ sơ của tôi", exact: true });
  await profile.focus();
  await expect(page.getByRole("tooltip")).toContainText("Hồ sơ của tôi");
  await page.screenshot({
    path: ".impeccable/review/gw95-candidate-collapsed-1440.png",
    animations: "disabled",
    fullPage: true,
  });
  await profile.click();
  await expect(page).toHaveURL(/\/can\/profile$/);
  expect(
    await original!.evaluate((el) => el === document.querySelector(".workspace-sidebar")),
  ).toBe(true);
  await expect(sidebar).toHaveCSS("width", "76px");
  await page.goto("/rec/account");
  await expect(sidebar).toHaveCSS("width", "76px");
  await expect(page.locator(".workspace-shell")).toHaveAttribute("data-sidebar-animate", "false");
  await expect(
    page.getByRole("navigation", { name: "Điều hướng nhanh" }).getByRole("link"),
  ).toHaveCount(3);
  await page.screenshot({
    path: ".impeccable/review/gw95-recruiter-collapsed-1440.png",
    animations: "disabled",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Mở rộng thanh điều hướng", exact: true }).click();
  await expect(sidebar).toHaveCSS("width", "244px");
  await page.screenshot({
    path: ".impeccable/review/gw95-recruiter-expanded-1440.png",
    animations: "disabled",
    fullPage: true,
  });
  const collapse = page.getByRole("button", { name: "Thu gọn thanh điều hướng", exact: true });
  await collapse.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(sidebar).toHaveCSS("width", "244px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("button", { name: "Thu gọn thanh điều hướng", exact: true }).click();
  await expect(sidebar).toHaveCSS("width", "76px");
  const duration = await page
    .locator(".workspace-shell")
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mở rộng thanh điều hướng", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Điều hướng nhanh" })
      .getByRole("link", { name: "Cài đặt tài khoản", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: ".impeccable/review/gw95-rail-mobile-expanded-390.png",
    animations: "disabled",
    fullPage: true,
  });
});
