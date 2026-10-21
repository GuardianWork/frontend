import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
async function ownerPage(page: Page) {
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 101,
          name: "Alpha",
          taxCode: "0101234567",
          verificationStatus: "VERIFIED",
          version: 1,
        },
      },
    }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/recruiter/members", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Tạo lời mời", exact: true })).toBeEnabled();
}
const invitation = {
  id: 17,
  email: "invitee@example.test",
  companyId: 101,
  companyName: "Alpha",
  companyRole: "RECRUITER",
  status: "PENDING",
  issuedAt: "2026-10-21T00:00:00Z",
  expiresAt: "2030-10-28T00:00:00Z",
  deliveryStatus: "PROVIDER_ACCEPTED",
};
test("Create invitation sends the backend request without adding a browser-local member", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/companies/me/invitations", async (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    expect(route.request().postDataJSON()).toEqual({ email: invitation.email });
    requests++;
    await route.fulfill({ status: 201, json: { status: 201, data: invitation } });
  });
  await ownerPage(page);
  await page.getByRole("textbox", { name: "Email thành viên" }).fill("Invitee@Example.test");
  await page.getByRole("button", { name: "Tạo lời mời", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả lời mời" }).getByRole("status"),
  ).toContainText("tiếp nhận yêu cầu gửi");
  await expect(page.getByRole("textbox", { name: "Email thành viên" })).toHaveValue("");
  await expect(page.locator("tbody")).not.toContainText(invitation.email);
  expect(requests).toBe(1);
});
test("failed delivery can resend the saved invitation through the backend", async ({ page }) => {
  await page.route("**/api/companies/me/invitations", (route) =>
    route.fulfill({
      status: 201,
      json: { status: 201, data: { ...invitation, deliveryStatus: "FAILED" } },
    }),
  );
  let resends = 0;
  await page.route("**/api/companies/me/invitations/17/resend", (route) => {
    expect(route.request().method()).toBe("POST");
    resends++;
    return route.fulfill({ json: { status: 200, data: invitation } });
  });
  await ownerPage(page);
  await page.getByRole("textbox", { name: "Email thành viên" }).fill(invitation.email);
  await page.getByRole("button", { name: "Tạo lời mời", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả lời mời" }).getByRole("status"),
  ).toContainText("đã được lưu nhưng gửi email thất bại");
  await page.getByRole("button", { name: "Gửi lại lời mời", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Kết quả lời mời" }).getByRole("status"),
  ).toContainText("tiếp nhận yêu cầu gửi");
  expect(resends).toBe(1);
});
test("backend invitation conflicts keep the input and display an error", async ({ page }) => {
  await page.route("**/api/companies/me/invitations", (route) =>
    route.fulfill({ status: 409, json: { status: 409, message: "PENDING_INVITATION_EXISTS" } }),
  );
  await ownerPage(page);
  await page.getByRole("textbox", { name: "Email thành viên" }).fill(invitation.email);
  await page.getByRole("button", { name: "Tạo lời mời", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Có thể đã tồn tại lời mời đang chờ");
  await expect(page.getByRole("textbox", { name: "Email thành viên" })).toHaveValue(
    invitation.email,
  );
  await expect(page.getByRole("region", { name: "Kết quả lời mời" })).toHaveCount(0);
});
