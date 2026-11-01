import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
async function ownerPage(page: Page) {
  await page.route("**/api/companies/me/invitations?*", (route) =>
    route.fulfill({
      json: { status: 200, data: { content: [], pageNumber: 0, totalElements: 0, totalPages: 0 } },
    }),
  );
  await page.route("**/api/companies/me/members?*", (route) =>
    route.fulfill({
      json: { status: 200, data: { content: [], totalElements: 0, totalPages: 0 } },
    }),
  );
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
  await page.goto("/rec/members", { waitUntil: "domcontentloaded" });
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

test("existing pending invitations survive reload and paginate with delivery details", async ({
  page,
}) => {
  await ownerPage(page);
  await page.route("**/api/companies/me/invitations?*", (route) => {
    const url = new URL(route.request().url());
    expect(url.searchParams.get("status")).toBe("PENDING");
    const pageNumber = Number(url.searchParams.get("page"));
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: [
            {
              ...invitation,
              id: 17 + pageNumber,
              email: pageNumber ? "second@example.test" : invitation.email,
              deliveryStatus: pageNumber ? "FAILED" : "PROVIDER_ACCEPTED",
            },
          ],
          pageNumber,
          totalElements: 21,
          totalPages: 2,
        },
      },
    });
  });
  const list = page.getByRole("region", { name: "Lời mời đang chờ", exact: true });
  await page.getByRole("button", { name: "Làm mới lời mời" }).click();
  await expect(list).toContainText(invitation.email);
  await expect(list).toContainText("Chờ chấp nhận");
  await page.reload();
  await expect(list).toContainText(invitation.email);
  await list.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/pending-invitations-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await list.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/pending-invitations-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(
    false,
  );
  await page.getByRole("button", { name: "Lời mời trang sau" }).click();
  await expect(list).toContainText("second@example.test");
  await expect(list).toContainText("Gửi email thất bại");
  await page.getByRole("button", { name: "Lời mời trang trước" }).click();
  await expect(list).toContainText(invitation.email);
});

test("pending invitation errors can retry without replaying creation", async ({ page }) => {
  await ownerPage(page);
  await page.route("**/api/companies/me/invitations?*", (route) =>
    route.fulfill({ status: 503, json: { status: 503, data: null } }),
  );
  await page.getByRole("button", { name: "Làm mới lời mời" }).click();
  const list = page.getByRole("region", { name: "Lời mời đang chờ", exact: true });
  await expect(list.getByRole("alert")).toContainText("Không thể tải");
  await page.route("**/api/companies/me/invitations?*", (route) =>
    route.fulfill({
      json: { status: 200, data: { content: [], pageNumber: 0, totalElements: 0, totalPages: 0 } },
    }),
  );
  await page.getByRole("button", { name: "Thử lại lời mời" }).click();
  await expect(list).toContainText("Chưa có lời mời đang chờ");
});

test("creating an invitation refreshes the pending list", async ({ page }) => {
  await ownerPage(page);
  let created = false;
  await page.route("**/api/companies/me/invitations?*", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          content: created ? [invitation] : [],
          pageNumber: 0,
          totalElements: created ? 1 : 0,
          totalPages: created ? 1 : 0,
        },
      },
    }),
  );
  await page.route("**/api/companies/me/invitations", (route) => {
    created = true;
    return route.fulfill({ status: 201, json: { status: 201, data: invitation } });
  });
  await page.getByRole("textbox", { name: "Email thành viên" }).fill(invitation.email);
  await page.getByRole("button", { name: "Tạo lời mời", exact: true }).click();
  await expect(page.getByRole("region", { name: "Lời mời đang chờ", exact: true })).toContainText(
    invitation.email,
  );
});

async function savedInvitation(page: Page, current: () => typeof invitation | null) {
  await page.route("**/api/companies/me/invitations?*", (route) => {
    const item = current();
    return route.fulfill({
      json: {
        status: 200,
        data: {
          content: item ? [item] : [],
          pageNumber: 0,
          totalElements: item ? 1 : 0,
          totalPages: item ? 1 : 0,
        },
      },
    });
  });
  await page.getByRole("button", { name: "Làm mới lời mời" }).click();
  const list = page.getByRole("region", { name: "Lời mời đang chờ", exact: true });
  await expect(list).toContainText(invitation.email);
  return list;
}

test("saved invitations resend with renewed expiry and honest delivery feedback", async ({
  page,
}) => {
  await ownerPage(page);
  let current = { ...invitation };
  const list = await savedInvitation(page, () => current);
  let requests = 0;
  await page.route("**/api/companies/me/invitations/17/resend", async (route) => {
    requests++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    current = { ...invitation, deliveryStatus: "FAILED", expiresAt: "2030-11-04T00:00:00Z" };
    await route.fulfill({ json: { status: 200, data: current } });
  });
  await list.getByRole("button", { name: "Gửi lại lời mời", exact: true }).click();
  await expect(list).toContainText("Liên kết cũ sẽ không còn hiệu lực");
  expect(requests).toBe(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await list.getByRole("group", { name: "Xác nhận gửi lại lời mời" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/invitation-actions-mobile.png" });
  await list.getByRole("button", { name: "Xác nhận gửi lại", exact: true }).click();
  await expect(list.getByRole("status").filter({ hasText: "gửi email thất bại" })).toBeVisible();
  await expect(list.locator("time")).toHaveAttribute("datetime", current.expiresAt);
  expect(requests).toBe(1);
});

test("revoking requires confirmation, removes the pending row and survives reload", async ({
  page,
}) => {
  await ownerPage(page);
  let revoked = false;
  const list = await savedInvitation(page, () => (revoked ? null : invitation));
  let requests = 0;
  await page.route("**/api/companies/me/invitations/17", (route) => {
    requests++;
    expect(route.request().method()).toBe("DELETE");
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    revoked = true;
    return route.fulfill({ json: { status: 200, data: { ...invitation, status: "REVOKED" } } });
  });
  await list.getByRole("button", { name: "Thu hồi lời mời", exact: true }).click();
  await list.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(requests).toBe(0);
  await expect(list.getByRole("group")).toHaveCount(0);
  await list.getByRole("button", { name: "Thu hồi lời mời", exact: true }).click();
  await list.getByRole("group").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "/tmp/invitation-actions-desktop.png" });
  await list.getByRole("button", { name: "Xác nhận thu hồi", exact: true }).click();
  await expect(list.getByRole("status").filter({ hasText: "Đã thu hồi" })).toBeVisible();
  await expect(list.getByRole("listitem")).toHaveCount(0);
  expect(requests).toBe(1);
  await page.reload();
  await expect(list).toContainText("Chưa có lời mời đang chờ");
});

test("revoke rejection refreshes the list and never reports success", async ({ page }) => {
  await ownerPage(page);
  const list = await savedInvitation(page, () => invitation);
  await page.route("**/api/companies/me/invitations/17", (route) =>
    route.fulfill({ status: 409, json: { status: 409, message: "Unavailable" } }),
  );
  await list.getByRole("button", { name: "Thu hồi lời mời", exact: true }).click();
  await list.getByRole("button", { name: "Xác nhận thu hồi", exact: true }).click();
  await expect(list.getByRole("alert")).toContainText("đã thay đổi");
  await expect(list).toContainText(invitation.email);
  await expect(list).not.toContainText("Đã thu hồi");
});
