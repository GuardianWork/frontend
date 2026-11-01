import { test, expect, login } from "./fixtures";
import type { Page, TestInfo } from "@playwright/test";
const phase = process.env.VISUAL_REVIEW_PHASE || "after";
async function capture(page: Page, info: TestInfo, name: string) {
  if (/\/(can|rec|staff)(?:\/|$)/.test(new URL(page.url()).pathname))
    await expect(page.locator(".workspace-page")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
  await page.screenshot({
    path: `/tmp/guardianwork-product/${phase}/${info.project.name}-${name}.png`,
    fullPage: true,
  });
}
test("candidate discovery, profile and reference content remain usable", async ({ page }, info) => {
  test.setTimeout(120000);
  await login(page, "candidate_demo");
  for (const route of ["/can", "/can/jobs", "/can/profile", "/can/copilot"]) {
    await page.goto(route);
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    await capture(page, info, route.split("/").filter(Boolean).join("-"));
    if (
      phase === "after" &&
      info.project.name === "desktop" &&
      /jobs|profile|copilot|verification|members/.test(route)
    ) {
      await page.setViewportSize({ width: 1024, height: 900 });
      await capture(page, info, `${route.split("/").filter(Boolean).join("-")}-1024`);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
});
test("verified recruiter workspace covers operational collections and company forms", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await login(page, "admin_demo");
  await page.evaluate(async () => {
    const session = JSON.parse(sessionStorage.getItem("guardianwork_auth_session")!);
    const response = await fetch("/api/staff/companies/101/verify", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "VERIFIED", expectedVersion: 0 }),
    });
    if (!response.ok) throw new Error("Mock company setup failed");
  });
  await login(page, "owner_demo", true);
  for (const route of [
    "/rec",
    "/rec/jobs",
    "/rec/applications",
    "/rec/talent",
    "/rec/verification",
    "/rec/members",
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    await capture(page, info, route.split("/").filter(Boolean).join("-"));
    if (
      phase === "after" &&
      info.project.name === "desktop" &&
      /jobs|profile|copilot|verification|members/.test(route)
    ) {
      await page.setViewportSize({ width: 1024, height: 900 });
      await capture(page, info, `${route.split("/").filter(Boolean).join("-")}-1024`);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
});
test("Staff operational pages preserve real and sample data presentation", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await login(page, "admin_demo");
  for (const route of [
    "/staff",
    "/staff/verifications",
    "/staff/jobs",
    "/staff/reports",
    "/staff/accounts",
    "/staff/audit-logs",
  ]) {
    await page.goto(`http://localhost:5138${route}`);
    await expect(page.locator("main h1, main h2").first()).toBeVisible();
    await capture(page, info, route.split("/").filter(Boolean).join("-"));
    if (
      phase === "after" &&
      info.project.name === "desktop" &&
      /jobs|profile|copilot|verification|members/.test(route)
    ) {
      await page.setViewportSize({ width: 1024, height: 900 });
      await capture(page, info, `${route.split("/").filter(Boolean).join("-")}-1024`);
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
});
test("public introduction, both auth purposes and recovery screens keep working", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  for (const [name, route] of [
    ["landing", "/vn"],
    ["candidate-login", "/login?role=candidate"],
    ["recruiter-login", "/login?role=recruiter"],
    ["candidate-register", "/register?role=candidate"],
    ["recruiter-register", "/register?role=recruiter"],
    ["not-found", "/page-that-does-not-exist"],
    ["staff-login", "http://localhost:5138/login"],
  ]) {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await capture(page, info, name);
    if (phase === "after" && info.project.name === "desktop" && name === "recruiter-login") {
      for (const width of [1000, 1024, 1100]) {
        await page.setViewportSize({ width, height: 900 });
        await capture(page, info, `${name}-${width}`);
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
});
