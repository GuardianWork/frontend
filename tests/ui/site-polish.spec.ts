import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
import { staffJobApi } from "./helpers/staff-job-api";

const phase = process.env.SITE_REVIEW_PHASE || "after";
async function captureRoutes(page: Page, routes: string[], area: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(route, { waitUntil: "load" });
    await expect(page.locator("main h1, main h2, h1").first()).toBeVisible();
    const searchAction = page.locator(".career-search button[type=submit]").first();
    if (await searchAction.count()) await expect(searchAction).toBeEnabled();
    const authInput = page
      .locator(
        ".auth-form-panel input:not([type=hidden]), .staff-login-form-panel input:not([type=hidden])",
      )
      .first();
    if (await authInput.count()) await expect(authInput).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    if (area === "staff" && route.endsWith("/staff/audit-logs")) {
      const colors = await page.locator(".audit-table .admin-record-status").evaluateAll((tags) => {
        const entries = new Map(tags.map((tag) => [tag.textContent, getComputedStyle(tag).color]));
        return [...entries.values()];
      });
      expect(colors).toHaveLength(6);
      expect(new Set(colors).size).toBe(6);
    }

    const tags = page.locator(".admin-record-status, .career-badge, .jp-badge, .status-tag");
    for (const tag of await tags.all()) {
      if (!(await tag.isVisible())) continue;
      const contrast = await tag.evaluate((element) => {
        const style = getComputedStyle(element);
        const luminance = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((n) => {
              const value = n / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const foreground = luminance(style.color);
        const background = luminance(style.backgroundColor);
        return (
          (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
        );
      });
      expect
        .soft(contrast, `${route}: ${await tag.textContent()} contrast`)
        .toBeGreaterThanOrEqual(4.5);
    }
    for (const width of [1440, 1024, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const overflow = await page.evaluate(() => {
        const main = document.querySelector(".workspace-content > main");
        return (
          document.documentElement.scrollWidth > innerWidth + 1 ||
          Boolean(main && main.scrollWidth > main.clientWidth + 1)
        );
      });
      expect.soft(overflow, `${route} overflows at ${width}px`).toBe(false);
      const name = new URL(page.url()).pathname.replaceAll("/", "-").replace(/^-/, "") || "home";
      const screenshot = {
        path: `/tmp/guardianwork-site-polish/${phase}/${area}-${width}-${name}-${routes.indexOf(route)}.png`,
        animations: "disabled" as const,
      };
      if (area === "public") await page.locator("body").screenshot(screenshot);
      else await page.screenshot({ ...screenshot, fullPage: true });
    }
  }
}

test("public discovery, authentication and recovery share the recruitment presentation", async ({
  page,
}) => {
  test.setTimeout(180000);
  await captureRoutes(
    page,
    [
      "/vn",
      "/jobs",
      "/login?role=candidate",
      "/login?role=recruiter",
      "/register?role=candidate",
      "/register?role=recruiter",
      "/account-recovery",
      "/missing-page",
    ],
    "public",
  );
});

test("candidate and recruiter pages retain their account controls across viewport sizes", async ({
  page,
}) => {
  test.setTimeout(180000);
  await login(page, "candidate_demo");
  await captureRoutes(
    page,
    [
      "/can/jobs",
      "/can/profile",
      "/can/cvs",
      "/can/copilot",
      "/can/account",
      "/rec/verification",
      "/rec/account",
    ],
    "workspace",
  );
  for (const route of ["/can/account", "/rec/account"]) {
    await page.goto(route);
    const open = page.getByRole("button", { name: /Mở (menu|điều hướng)/ });
    await open.click();
    const quick = page.getByRole("navigation", { name: "Điều hướng nhanh" });
    await expect(quick.getByRole("link")).toHaveCount(3);
    await expect(quick.getByRole("link", { name: "Cài đặt tài khoản", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(quick).toBeHidden();
    await expect(open).toBeFocused();
  }
});

test("staff operational screens and login remain readable across viewport sizes", async ({
  page,
  mockApiUrl,
}) => {
  test.setTimeout(180000);
  await captureRoutes(page, ["http://localhost:5138/login"], "staff");
  const response = await page.request.post(`${mockApiUrl}/api/auth/login`, {
    data: { usernameOrEmail: "admin_demo", password: "Guardian123!" },
  });
  expect(response.ok()).toBe(true);
  const { data } = await response.json();
  const jobApi = await staffJobApi(page);
  await page.route("**/api/staff/accounts/users?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: [
            {
              id: 25,
              username: "nguyen.an",
              firstName: "An",
              lastName: "Nguyễn",
              email: "an@example.test",
              role: "USER",
              emailVerified: true,
              status: "ACTIVE",
              createdAt: "2026-10-01T02:00:00Z",
              updatedAt: null,
              activeBan: null,
              canBan: true,
              canUnban: false,
            },
          ],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.evaluate(
    (session) =>
      sessionStorage.setItem(
        "guardianwork_auth_session",
        JSON.stringify({ ...session, expiresAt: Date.now() + session.expiresIn * 1000 }),
      ),
    data,
  );
  await captureRoutes(
    page,
    [
      "/staff",
      "/staff/verifications",
      "/staff/jobs",
      "/staff/reports",
      "/staff/accounts",
      "/staff/audit-logs",
    ].map((path) => `http://localhost:5138${path}`),
    "staff",
  );
  await page.goto("http://localhost:5138/staff/accounts");
  await expect(page.locator(".admin-record-status--verified").first()).toHaveCSS(
    "color",
    "rgb(23, 96, 57)",
  );
  await page.goto("http://localhost:5138/staff/verifications");
  await expect(page.locator(".admin-record-status--pending").first()).toHaveCSS(
    "color",
    "rgb(121, 68, 0)",
  );
  await page.goto("http://localhost:5138/staff/audit-logs");
  const auditTable = page.getByRole("table");
  await expect(auditTable.locator(".admin-record-status--verified").first()).toHaveCSS(
    "color",
    "rgb(23, 96, 57)",
  );
  await expect(auditTable.locator(".admin-record-status--rejected").first()).toHaveCSS(
    "color",
    "rgb(161, 35, 32)",
  );
  await page.getByRole("button", { name: "Chi tiết AUD-0014", exact: true }).click();
  await expect(page.locator("#detail-AUD-0014 .admin-record-status--pending")).toHaveCSS(
    "color",
    "rgb(121, 68, 0)",
  );
  await expect(page.locator("#detail-AUD-0014 .admin-record-status--verified")).toHaveCSS(
    "color",
    "rgb(23, 96, 57)",
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `/tmp/guardianwork-site-polish/after/audit-tags-${width}.png`,
      fullPage: true,
    });
  }
  const reviewColors: string[] = [];
  for (const state of ["PENDING_REVIEW", "APPROVED", "REJECTED", "WITHDRAWN"]) {
    jobApi.review.state = state;
    await page.goto("http://localhost:5138/staff/jobs");
    await page.locator(".staff-jobs select").selectOption(state);
    const badge = page.locator(".staff-jobs-table .admin-record-status").first();
    await expect(badge).toBeVisible();
    reviewColors.push(await badge.evaluate((tag) => getComputedStyle(tag).color));
  }
  expect(new Set(reviewColors).size).toBe(4);
  jobApi.review.state = "PENDING_REVIEW";
  jobApi.failList = true;
  await page.goto("http://localhost:5138/staff/jobs");
  const alert = page.getByRole("alert");
  await expect(alert).toBeVisible();
  await expect(alert).toHaveCSS("text-align", "start");
  await expect(alert).toHaveCSS("background-color", "rgb(253, 239, 239)");
  await expect(page.getByRole("button", { name: "Thử tải lại", exact: true })).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `/tmp/guardianwork-site-polish/after/staff-alert-${width}.png`,
      fullPage: true,
    });
  }
});

test("attention notices use the supplied pale pink highlight with a visible error mark", async ({
  page,
}) => {
  await page.goto("/login?role=candidate");
  await page.locator("#login-identifier").fill("missing_account");
  await page.locator("#login-password").fill("WrongPassword123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const notice = page.getByRole("alert");
  await expect(notice).toBeVisible();
  await expect(notice).toHaveCSS("background-color", "rgb(253, 239, 239)");
  await expect(notice).toHaveCSS("color", "rgb(45, 45, 45)");
  expect(await notice.evaluate((el) => getComputedStyle(el, "::before").backgroundColor)).toBe(
    "rgb(179, 38, 30)",
  );
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.screenshot({
      path: `/tmp/guardianwork-site-polish/after/notice-${width}.png`,
      fullPage: true,
    });
  }
});
