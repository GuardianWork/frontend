import { test, expect, login } from "./fixtures";

test("candidate tracks interviews, withdraws with fresh version, and cannot withdraw a hire", async ({
  page,
}) => {
  await login(page, "candidate_demo");
  let status = "INTERVIEWING";
  let version = 3;
  const writes: unknown[] = [];
  const row = () => ({
    id: "lifecycle-1",
    jobId: 42,
    jobTitle: "Chuyên viên kinh doanh",
    companyId: 1,
    companyName: "Công ty Alpha",
    status,
    version,
    appliedAt: "2026-11-01T08:30:00Z",
    cvFileName: "CV.pdf",
    history: [
      { toStatus: "SUBMITTED", occurredAt: "2026-11-01T08:30:00Z" },
      { toStatus: status, occurredAt: "2026-11-10T08:30:00Z" },
    ],
  });
  await page.route(/\/api\/candidate\/applications(?:\?|\/|$)/, async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/withdraw")) {
      writes.push(route.request().postDataJSON());
      status = "WITHDRAWN";
      version++;
      return route.fulfill({ json: { status: 200, data: row() } });
    }
    return route.fulfill({
      json: { status: 200, data: url.pathname.endsWith("lifecycle-1") ? row() : [row()] },
    });
  });
  await page.goto("/can/applied");
  const card = page.locator(".application-card");
  await card.locator(".application-card__status").click();
  await expect(card.getByRole("heading", { name: "Lịch sử trạng thái" })).toBeVisible();
  await expect(card).toContainText("Nhà tuyển dụng sẽ liên hệ");
  await page.screenshot({
    path: ".impeccable/review/lifecycle/candidate-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await card.getByRole("button", { name: "Rút đơn ứng tuyển", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Giữ đơn ứng tuyển" }).click();
  expect(writes).toEqual([]);
  await card.getByRole("button", { name: "Rút đơn ứng tuyển", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận rút đơn", exact: true }).click();
  await expect(card.locator(".application-card__status-tag")).toHaveText("Đã rút");
  expect(writes).toEqual([{ version: 3 }]);
  status = "HIRED";
  version++;
  await page.reload();
  await expect(card.locator(".application-card__status-tag")).toHaveText("Đã tuyển");
  await card.locator(".application-card__status").click();
  await expect(card.getByRole("heading", { name: "Lịch sử trạng thái" })).toBeVisible();
  await expect(card.getByRole("button", { name: "Rút đơn ứng tuyển", exact: true })).toHaveCount(0);
});
