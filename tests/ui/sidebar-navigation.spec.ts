import { test, expect, login } from "./fixtures";

test("Staff overview loses selection after another sidebar section is opened", async ({
  page,
}, info) => {
  await login(page, "admin_demo");
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
  const nav = page.getByRole("navigation", { name: "Điều hướng chính", exact: true });
  await expect(nav.getByRole("link", { name: "Tổng quan", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "Xác minh công ty", exact: true }).click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
  await expect(nav.getByRole("link", { name: "Xác minh công ty", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Tổng quan", exact: true })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
  await page.screenshot({
    path: `/tmp/guardianwork-refinement/${info.project.name}-staff-sidebar.png`,
  });
});

test("candidate navigation shares Staff styling and follows selection on mobile and desktop", async ({
  page,
}, info) => {
  await login(page, "candidate_demo");
  await page.goto("/candidate/jobs");
  const nav = page.getByRole("navigation", { name: "Điều hướng chính", exact: true });
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
  await nav.getByRole("link", { name: "Hồ sơ của tôi", exact: true }).click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở điều hướng" }).click();
  const selected = nav.getByRole("link", { name: "Hồ sơ của tôi", exact: true });
  await expect(selected).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
  await page.mouse.move(600, 300);
  await expect(selected).toHaveCSS("border-radius", "12px");
  await expect(selected.locator(".workspace-nav-icon")).toHaveCSS(
    "background-color",
    "rgb(8, 104, 201)",
  );
  await selected.focus();
  await expect(selected).toBeFocused();
  if (info.project.name === "desktop") {
    await nav.getByRole("link", { name: "Tìm việc làm", exact: true }).hover();
    await expect(selected).toHaveAttribute("aria-current", "page");
  }
  await page.screenshot({
    path: `/tmp/guardianwork-refinement/${info.project.name}-candidate-sidebar.png`,
  });
  if (info.project.name === "mobile") {
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
  }
});

test("recruiter navigation shares Staff styling without selecting overview on jobs", async ({
  page,
}, info) => {
  test.setTimeout(60000);
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
  const nav = page.getByRole("navigation", { name: "Điều hướng nhà tuyển dụng", exact: true });
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await nav.getByRole("link", { name: "Tin tuyển dụng", exact: true }).click();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const selected = nav.getByRole("link", { name: "Tin tuyển dụng", exact: true });
  await expect(selected).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Tổng quan", exact: true })).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
  await page.mouse.move(600, 300);
  await expect(selected).toHaveCSS("border-radius", "12px");
  await expect(selected.locator(".workspace-nav-icon")).toHaveCSS(
    "background-color",
    "rgb(8, 104, 201)",
  );
  await page.screenshot({
    path: `/tmp/guardianwork-refinement/${info.project.name}-recruiter-sidebar.png`,
  });
});

test("pending recruiter keeps locked navigation unavailable after the visual refinement", async ({
  page,
}, info) => {
  await login(page, "owner_demo", true);
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Điều hướng nhà tuyển dụng", exact: true });
  await expect(nav.getByRole("link", { name: "Tin tuyển dụng", exact: true })).toHaveCount(0);
  await expect(
    nav.locator('[aria-disabled="true"]').filter({ hasText: "Tin tuyển dụng" }),
  ).toBeVisible();
});
