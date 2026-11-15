import { test, expect, login } from "./fixtures";

test("public company directory opens a dossier and returns to the directory", async ({ page }) => {
  await page.goto("/companies", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Công ty đang tuyển dụng" })).toBeVisible();

  const firstCompany = page.locator(".company-card").first();
  await expect(firstCompany).toBeVisible();
  await firstCompany.click();

  await expect(page).toHaveURL(/\/companies\/\d+$/);
  await expect(page.locator(".company-dossier-hero h1")).toBeVisible();
  await expect(page.locator("#company-overview")).toBeVisible();
  await expect(page.locator("#company-about")).not.toContainText("Chưa công khai");
  await expect(page.locator("#company-expertise .company-expertise li").first()).toBeVisible();
  await expect(page.locator("#company-headquarters .company-headquarters")).toBeVisible();
  await expect(page.locator(".company-rail-card__demo")).toContainText("dữ liệu minh hoạ");

  await expect(page.getByRole("tab", { name: "Đánh giá" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  await page.getByRole("tab", { name: "Việc làm" }).click();
  await expect(page).toHaveURL(/tab=viec-lam/);
  await expect(page.locator("#company-roles")).toBeVisible();

  await page.getByRole("link", { name: /Danh sách công ty/ }).click();
  await expect(page).toHaveURL(/\/companies$/);
});

test("candidate company pages keep the Candidate workspace mounted", async ({ page }) => {
  await login(page, "candidate_demo");
  await page.goto("/can/jobs", { waitUntil: "networkidle" });

  const sidebar = page.getByRole("navigation", { name: "Điều hướng chính", exact: true });
  await sidebar.getByRole("link", { name: "Công ty", exact: true }).click();

  await expect(page).toHaveURL(/\/can\/companies$/);
  await expect(page.locator(".candidate-workspace")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Công ty đang tuyển dụng" })).toBeVisible();

  await page.locator(".company-card").first().click();
  await expect(page).toHaveURL(/\/can\/companies\/\d+$/);
  await expect(page.locator(".candidate-workspace")).toBeVisible();
  await expect(page.locator(".company-dossier-hero h1")).toHaveCSS("color", "rgb(255, 255, 255)");
});
