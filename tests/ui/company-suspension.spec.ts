import { test, expect, login } from "./fixtures";

test("owner sees staff suspension, retains verification and refreshes on returning to the tab", async ({
  page,
}, info) => {
  let suspended = false;
  let unavailable = false;
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      status: unavailable ? 503 : 200,
      json: unavailable
        ? { message: "Unavailable" }
        : {
            status: 200,
            data: {
              id: 101,
              name: "Công ty TNHH Giải Pháp Alpha",
              taxCode: "0101234567",
              verificationStatus: "VERIFIED",
              companySuspended: suspended,
              version: suspended ? 2 : 1,
            },
          },
    }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/verification");
  await expect(page.getByRole("heading", { name: "Hồ sơ công ty", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tải lại trạng thái", exact: true })).toBeEnabled();
  await page.screenshot({ path: info.outputPath("company-active.png"), fullPage: true });
  suspended = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByRole("heading", { name: "Công ty đã bị tạm ngưng hoạt động" }),
  ).toBeVisible();
  await expect(page.getByText("Trạng thái xác minh: Đã xác minh")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tên công ty" })).toBeDisabled();
  await page.screenshot({ path: info.outputPath("company-suspended.png"), fullPage: true });
  unavailable = true;
  await page.getByRole("button", { name: "Tải lại trạng thái", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Chưa tải được trạng thái công ty mới nhất");
  await expect(
    page.getByRole("heading", { name: "Công ty đã bị tạm ngưng hoạt động" }),
  ).toBeVisible();
  unavailable = false;
  await page.goto("/rec/jobs");
  await expect(
    page.getByRole("heading", { name: "Công ty đã bị tạm ngưng hoạt động" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Xem hồ sơ công ty", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Xem hồ sơ công ty", exact: true }).click();
  suspended = false;
  await page.getByRole("button", { name: "Tải lại trạng thái", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Công ty đã bị tạm ngưng hoạt động" }),
  ).toHaveCount(0);
});

test("suspended rejected owner can view feedback without submitting corrections", async ({
  page,
}) => {
  await page.route("**/api/companies/me/verification", (route) =>
    route.fulfill({
      json: {
        status: 200,
        data: {
          id: 101,
          name: "Công ty Alpha",
          taxCode: "0101234567",
          version: 2,
          verificationStatus: "REJECTED",
          companySuspended: true,
          rejectionReason: "Tài liệu đăng ký chưa rõ.",
        },
      },
    }),
  );
  await login(page, "owner_demo", true);
  await page.goto("/rec/verification");
  await expect(
    page.getByRole("heading", { name: "Công ty đã bị tạm ngưng hoạt động" }),
  ).toBeVisible();
  await expect(page.getByText("Tài liệu đăng ký chưa rõ.", { exact: false })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Tên công ty" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Gửi lại hồ sơ", exact: true })).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Các bước bắt đầu tuyển dụng" })).toHaveCount(0);
});
