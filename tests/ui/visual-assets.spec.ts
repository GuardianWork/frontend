import { test, expect, login } from "./fixtures";
import type { Page, TestInfo } from "@playwright/test";

const screenshots = "/tmp/guardianwork-refinement";
const staff = process.env.STAFF_UI_BASE_URL || "http://localhost:5138";
async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const images = page.locator(".guardian-art img");
  for (const image of await images.all()) {
    if (!(await image.isVisible())) continue;
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((img: HTMLImageElement) => img.decode());
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
  const art = await page.locator(".guardian-art img").evaluateAll((images) =>
    images.map((node) => {
      const img = node as HTMLImageElement;
      const rect = img.getBoundingClientRect();
      return {
        visible: rect.width > 0,
        width: rect.width,
        height: rect.height,
        intrinsicWidth: Number(img.getAttribute("width")),
        intrinsicHeight: Number(img.getAttribute("height")),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        alt: img.alt,
      };
    }),
  );
  for (const image of art.filter((image) => image.visible)) {
    expect(image.alt).toBe("");
    expect(image.naturalWidth).toBeGreaterThan(1);
    expect(image.width).toBeLessThanOrEqual(image.naturalWidth + 1);
    expect(image.width / image.height).toBeCloseTo(image.intrinsicWidth / image.intrinsicHeight, 2);
    expect(image.naturalWidth / image.naturalHeight).toBeCloseTo(
      image.intrinsicWidth / image.intrinsicHeight,
      2,
    );
  }
  await page.screenshot({
    path: `${screenshots}/${info.project.name}-${name}.png`,
    fullPage: true,
  });
}

test("landing and audience-specific auth preserve search, forms and responsive artwork", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/images/illustrations/")) downloads.push(request.url());
  });
  await page.goto("/vn");
  await expect(page.getByRole("button", { name: "Tìm việc ngay", exact: true })).toBeEnabled();
  await capture(page, info, "landing");
  await page.getByRole("textbox", { name: "Vị trí, kỹ năng hoặc công ty" }).focus();
  await expect(page.getByRole("textbox", { name: "Vị trí, kỹ năng hoặc công ty" })).toBeFocused();
  for (const purpose of ["candidate", "recruiter"]) {
    for (const mode of ["login", "register"]) {
      await page.goto(`/${mode}?role=${purpose}`);
      await expect(page.locator('input[type="password"]').first()).toBeEnabled();
      await expect(page.locator(".guardian-art")).toHaveCount(1);
      await capture(page, info, `${purpose}-${mode}`);
      const password = page.locator('input[type="password"]').first();
      await password.fill("Guardian123!");
      const toggle = page.getByRole("button", { name: /^Hiện mật khẩu$/ }).first();
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("button", { name: /^Ẩn mật khẩu$/ }).first()).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    }
  }
  expect(downloads.some((url) => url.endsWith("08-multi-industry-careers.png"))).toBe(true);
  if (info.project.name === "desktop") {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/vn");
    await expect(page.locator(".guardian-art--landing")).toBeVisible();
    await capture(page, info, "landing-1024");
    await page.goto("/login?role=recruiter");
    await capture(page, info, "employer-auth-1024");
  }
});

test("candidate welcome and current profile keep navigation and edit controls", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await page.goto("/can");
  await expect(page.locator(".guardian-welcome")).toBeVisible();
  await capture(page, info, "candidate-welcome");
  await page.goto("/can/profile");
  await expect(page.getByRole("button", { name: "Chỉnh sửa hồ sơ" })).toBeVisible();
  await capture(page, info, "candidate-profile");
});

test("recruiter welcome and genuine empty jobs keep create action and filter distinctions", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  // Confirm company through the mock's real versioned decision flow before entering its workspace.
  await login(page, "admin_demo");
  const status = await page.evaluate(async () => {
    const session = JSON.parse(sessionStorage.getItem("guardianwork_auth_session")!);
    return (
      await fetch("/api/staff/companies/101/verify", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "VERIFIED", expectedVersion: 0 }),
      })
    ).status;
  });
  expect(status).toBe(200);
  await login(page, "owner_demo", true);
  await expect(page.locator(".guardian-welcome")).toBeVisible();
  await capture(page, info, "recruiter-welcome");
  await page.route("**/api/companies/me/jobs?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: [],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.goto("/rec/jobs");
  await expect(
    page.getByRole("heading", { name: "Bắt đầu với tin tuyển dụng đầu tiên" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng tin tuyển dụng", exact: true })).toHaveCount(2);
  await expect(page.locator(".guardian-art--empty")).toHaveCount(0);
  await capture(page, info, "recruiter-jobs-empty");
  await page.getByLabel("Trạng thái xuất bản", { exact: true }).selectOption("DRAFT");
  await expect(page.getByRole("heading", { name: "Không có tin phù hợp" })).toBeVisible();
  await expect(page.locator(".guardian-art--empty")).toHaveCount(0);
  await page.getByRole("button", { name: "Xem tất cả tin", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bắt đầu với tin tuyển dụng đầu tiên" }),
  ).toBeVisible();
});

test("Staff queue artwork is exclusive to genuine empty pending results", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await login(page, "admin_demo");
  await page.goto(`${staff}/staff/verifications`);
  await expect(page.getByRole("button", { name: /Mở hồ sơ/ })).toBeVisible();
  await expect(page.locator(".guardian-art")).toHaveCount(0);
  await capture(page, info, "staff-populated");
  let state = "empty";
  let release: (() => void) | undefined;
  await page.route("**/api/staff/companies/verifications?**", async (route) => {
    if (state === "loading")
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    if (state === "error") return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fulfill({
      json: {
        data: {
          content: [],
          pageNumber: 0,
          pageSize: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true,
        },
      },
    });
  });
  await page.reload();
  await expect(page.locator(".guardian-art--empty")).toBeVisible();
  await capture(page, info, "staff-empty");
  await page.getByRole("searchbox").fill("không tồn tại");
  await expect(page.locator(".guardian-art")).toHaveCount(0);
  await page.getByRole("searchbox").fill("");
  await page.getByRole("combobox", { name: "Lọc trạng thái hồ sơ" }).selectOption("REJECTED");
  await expect(page.getByRole("heading", { name: "Không có hồ sơ trong mục này" })).toBeVisible();
  await expect(page.locator(".guardian-art")).toHaveCount(0);
  state = "loading";
  await page.getByRole("combobox", { name: "Lọc trạng thái hồ sơ" }).selectOption("PENDING");
  await expect(page.locator(".admin-list-state[role=status]")).toContainText(
    "Đang tải hồ sơ xác minh",
  );
  await expect(page.locator(".guardian-art")).toHaveCount(0);
  await capture(page, info, "staff-loading");
  state = "error";
  release?.();
  await expect(page.getByRole("heading", { name: "Không tải được hồ sơ" })).toBeVisible();
  await expect(page.locator(".guardian-art")).toHaveCount(0);
  await capture(page, info, "staff-error");
});

test("semantic icons retain distinct geometry, sizing and accessible decoration", async ({
  page,
}, info) => {
  await page.goto("/vn", { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => {
    const { mountIconReview } = await import("/tests/ui/icon-review.tsx");
    mountIconReview();
  });
  await expect(page.locator("#icon-review svg")).toHaveCount(72);
  await expect(page.locator("#icon-review svg:not([aria-hidden='true'])")).toHaveCount(0);
  const sizes = await page
    .locator("#icon-review > div > div")
    .first()
    .locator("svg")
    .evaluateAll((nodes) => nodes.map((svg) => Math.round(svg.getBoundingClientRect().width)));
  expect(sizes).toEqual([15, 16, 20, 24]);
  await page.screenshot({
    path: `${screenshots}/${info.project.name}-icon-sizes.png`,
    fullPage: true,
  });
});
