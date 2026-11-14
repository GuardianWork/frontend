import { test, expect, login } from "./fixtures";
import type { Page } from "@playwright/test";
const response = {
  schemaVersion: "1",
  mode: "crawler",
  profile: "jd-local-v1",
  legalSnapshot: "test-labor",
  asOfDate: "2026-11-14",
  model: "test-provider",
  status: "ANSWERED",
  answer: "Theo Điều 25, hãy đối chiếu điều kiện thử việc trong nguồn được truy xuất.",
  warnings: ["Cần đối chiếu hiệu lực điều khoản."],
  citations: [
    {
      nodeId: "doc:139264:art:25",
      label: "Điều 25",
      documentNumber: "45/2019/QH14",
      quote: "Chỉ được thử việc một lần đối với một công việc.",
      quoteGrounded: true,
      effectiveStatus: "Hết hiệu lực một phần",
      applicability: "UNVERIFIED",
    },
  ],
};
async function open(page: Page) {
  await login(page, "candidate_demo");
  await page.goto("/can/copilot");
  await expect(page.getByRole("heading", { name: "Trợ lý pháp lý", exact: true })).toBeVisible();
}
test("questions request real backend responses, show pending and attach only returned citations", async ({
  page,
}) => {
  await open(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  await page.route("**/api/candidates/me/legal-chat", async (route) => {
    calls++;
    expect(route.request().postDataJSON().question).toContain("Điều 25");
    expect(route.request().headers().authorization).toMatch(/^Bearer /);
    await pending;
    await route.fulfill({ json: { status: 200, data: response } });
  });
  await page.getByRole("button", { name: "Thử việc 3 tháng có đúng luật?", exact: true }).click();
  const answer = page.getByRole("article", { name: "Phản hồi AI", exact: true });
  await expect(answer).toHaveAttribute("aria-busy", "true");
  await expect(page.getByRole("button", { name: "Gửi câu hỏi" })).toBeDisabled();
  release();
  await expect(answer).toHaveAttribute("aria-busy", "false");
  await expect(answer).toContainText(response.answer);
  await answer.locator("summary").click();
  await expect(answer).toContainText(response.citations[0].quote);
  const quoteWidth = await answer
    .locator("blockquote")
    .evaluate((element) => element.getBoundingClientRect().width);
  const answerWidth = await answer.evaluate((element) => element.getBoundingClientRect().width);
  expect(quoteWidth / answerWidth).toBeGreaterThan(0.8);
  await expect(answer).toContainText("Cần xác minh hiệu lực điều khoản");
  expect(calls).toBe(1);
  await expect(page.getByText("Phản hồi mẫu", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
test("provider failure retains the question and explicit retry uses the same exchange", async ({
  page,
}) => {
  await open(page);
  let calls = 0;
  await page.route("**/api/candidates/me/legal-chat", async (route) => {
    calls++;
    await route.fulfill(
      calls === 1
        ? { status: 503, json: { status: 503, message: "unavailable", data: null } }
        : { json: { status: 200, data: response } },
    );
  });
  const input = page.getByRole("textbox", { name: "Câu hỏi về hợp đồng hoặc thử việc" });
  await input.fill("Thử việc theo Điều 25?");
  await input.press("Enter");
  await expect(page.getByRole("alert")).toContainText("Chưa thể nhận phản hồi");
  const notice = page.getByRole("alert");
  const layout = await notice.evaluate((element) => {
    const icon = getComputedStyle(element, "::before");
    const paragraph = element.querySelector("p")!;
    return {
      iconEnd:
        element.getBoundingClientRect().left + parseFloat(icon.left) + parseFloat(icon.width),
      textStart: paragraph.getBoundingClientRect().left,
      background: getComputedStyle(element).backgroundColor,
    };
  });
  expect(layout.textStart).toBeGreaterThanOrEqual(layout.iconEnd + 12);
  expect(layout.background).toBe("rgb(253, 239, 239)");
  await expect(page.locator(".legal-chat-answer-text")).toHaveCount(0);
  await expect(page.locator(".legal-chat-question")).toContainText("Thử việc theo Điều 25?");
  await page.getByRole("button", { name: "Thử lại câu hỏi", exact: true }).click();
  await expect(page.getByRole("article", { name: "Phản hồi AI" })).toContainText(response.answer);
  await expect(page.getByRole("article", { name: "Phản hồi AI" })).toHaveCount(1);
  expect(calls).toBe(2);
});
test("conversation switching preserves drafts and late responses stay with their question", async ({
  page,
}) => {
  await open(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/candidates/me/legal-chat", async (route) => {
    await pending;
    await route.fulfill({ json: { status: 200, data: response } });
  });
  const input = page.getByRole("textbox", { name: "Câu hỏi về hợp đồng hoặc thử việc" });
  await input.fill("Thử việc theo Điều 25?");
  await input.press("Enter");
  await expect(page.getByRole("article", { name: "Phản hồi AI" })).toHaveAttribute(
    "aria-busy",
    "true",
  );
  await page.getByRole("button", { name: "Cuộc trò chuyện mới", exact: true }).click();
  await input.fill("Bản nháp mới");
  await input.press("Shift+Enter");
  await input.type("Dòng hai");
  release();
  await expect(page.getByRole("article", { name: "Phản hồi AI" })).toHaveCount(0);
  const history = page.getByRole("complementary", { name: "Cuộc trò chuyện và chủ đề" });
  await history.getByRole("button", { name: "Thử việc theo Điều 25?", exact: true }).click();
  await expect(page.getByRole("article", { name: "Phản hồi AI" })).toContainText(response.answer);
  await history.getByRole("button", { name: "Bản nháp mới Dòng hai" }).click();
  await expect(input).toHaveValue("Bản nháp mới\nDòng hai");
});

test("history can be hidden and formatted answers keep the composer visible", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: "Ẩn lịch sử trò chuyện" }).click();
  await expect(page.getByRole("complementary", { name: "Cuộc trò chuyện và chủ đề" })).toBeHidden();
  await page.getByRole("button", { name: "Hiện lịch sử trò chuyện" }).click();
  await expect(
    page.getByRole("complementary", { name: "Cuộc trò chuyện và chủ đề" }),
  ).toBeVisible();
  const answerText =
    "### Nội dung cần kiểm tra\n\n**Điều kiện trong hợp đồng**\n\n- Thời gian thử việc\n- Mức lương thỏa thuận\n\n[Đọc nguồn](https://vbpl.vn)\n\n" +
    "Nội dung giải thích để kiểm tra khả năng cuộn và giữ ô nhập câu hỏi.\n\n".repeat(30);
  await page.route("**/api/candidates/me/legal-chat", (route) =>
    route.fulfill({ json: { status: 200, data: { ...response, answer: answerText } } }),
  );
  await page.getByRole("button", { name: "Thử việc 3 tháng có đúng luật?", exact: true }).click();
  const answer = page.getByRole("article", { name: "Phản hồi AI" });
  await expect(answer.getByRole("heading", { name: "Nội dung cần kiểm tra" })).toHaveCount(1);
  await expect(answer.locator("strong").first()).toHaveText("Điều kiện trong hợp đồng");
  await expect(answer.locator(".legal-chat-answer-text li")).toHaveCount(2);
  await expect(answer.getByRole("link", { name: "Đọc nguồn" })).toHaveAttribute("target", "_blank");
  const input = page.getByRole("textbox", { name: "Câu hỏi về hợp đồng hoặc thử việc" });
  await expect(input).toBeInViewport();
  await expect(page.getByRole("button", { name: "Gửi câu hỏi" })).toBeInViewport();
  const transcript = page.getByRole("region", { name: "Nội dung cuộc trò chuyện" });
  expect(await transcript.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
    true,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("clipboard failure notice aligns with the composer and does not obscure controls", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw new Error("Clipboard unavailable");
        },
      },
      configurable: true,
    });
  });
  await open(page);
  await page.route("**/api/candidates/me/legal-chat", (route) =>
    route.fulfill({ json: { status: 200, data: response } }),
  );
  await page.getByRole("button", { name: "Thử việc 3 tháng có đúng luật?", exact: true }).click();
  await page.getByRole("button", { name: "Sao chép câu trả lời", exact: true }).click();
  const notice = page.getByRole("alert");
  await expect(notice).toContainText("Không thể sao chép tự động");
  const box = (await notice.boundingBox())!;
  const composer = (await page.locator(".legal-chat-composer").boundingBox())!;
  expect(Math.abs(box.x - composer.x)).toBeLessThan(1);
  expect(Math.abs(box.width - composer.width)).toBeLessThan(1);
  expect(box.y + box.height).toBeLessThanOrEqual(composer.y);
  await expect(
    page.getByRole("textbox", { name: "Câu hỏi về hợp đồng hoặc thử việc" }),
  ).toBeInViewport();
  await expect(page.getByRole("button", { name: "Gửi câu hỏi" })).toBeInViewport();
  await page.getByRole("button", { name: "Cuộc trò chuyện mới", exact: true }).click();
  await expect(notice).toHaveCount(0);
});
