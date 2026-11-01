import { test, expect, login } from "./fixtures";

const job = {
  id: 42,
  company: { id: 101, name: "Integration Company" },
  content: {
    title: "Integration job from main",
    description: "Backend description preserved after merge.",
    location: "Hà Nội",
    employmentType: "FULL_TIME",
    workArrangement: "ON_SITE",
    compensation: { disclosed: false },
  },
  publicationStatus: "PUBLISHED",
  approvedDeadline: null,
  applicationsAvailable: true,
  applicationAvailabilityReason: null,
};

test("backend job details work for guests and within the persistent Candidate workspace", async ({
  page,
}) => {
  await page.route("**/api/jobs/search?**", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: [job],
          pageNumber: 0,
          pageSize: 6,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
        },
      },
    }),
  );
  await page.route("**/api/jobs/42", (route) =>
    route.fulfill({ json: { status: 200, data: job } }),
  );
  await page.goto("/jobs?job=42");
  await expect(page.getByRole("heading", { name: job.content.title, exact: true })).toBeVisible();
  await expect(page.getByText(job.content.description, { exact: true })).toBeVisible();
  await expect(page.locator(".career-header")).toHaveCount(1);

  await login(page, "candidate_demo");
  await page.goto("/can/jobs?job=42");
  await expect(page.getByRole("heading", { name: job.content.title, exact: true })).toBeVisible();
  await expect(page.getByText(job.content.description, { exact: true })).toBeVisible();
  await expect(page.locator(".candidate-workspace .workspace-sidebar")).toBeVisible();
  await expect(page.locator(".career-header")).toHaveCount(0);
  await expect(page.locator("main main")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Điều hướng nhanh" }).getByRole("link"),
  ).toHaveCount(3);

  const sidebar = await page.locator(".workspace-sidebar").elementHandle();
  await page.getByRole("link", { name: "Ứng tuyển ngay", exact: true }).click();
  await expect(page).toHaveURL(/\/can\/jobs\/apply/);
  await expect(page.locator(".apply-form")).toBeVisible();
  await expect(page.getByRole("heading", { name: job.content.title, exact: true })).toBeVisible();
  expect(await sidebar!.evaluate((el) => el === document.querySelector(".workspace-sidebar"))).toBe(
    true,
  );
  await page.goto("/can/jobs/apply?job=42");
  await expect(page.locator(".apply-form")).toBeVisible();
  await expect(page.getByRole("heading", { name: job.content.title, exact: true })).toBeVisible();
});
