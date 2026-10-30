# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: job-publishing.spec.ts >> owner creates an incomplete draft, sees validation, completes and submits the persisted revision
- Location: tests/ui/job-publishing.spec.ts:256:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Bắt đầu với tin tuyển dụng đầu tiên' })
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'Bắt đầu với tin tuyển dụng đầu tiên' }) with timeout 7000ms
  - waiting for getByRole('heading', { name: 'Bắt đầu với tin tuyển dụng đầu tiên' })

```

```yaml
- complementary:
  - link "GuardianWork Nhà tuyển dụng":
    - /url: /recruiter
  - paragraph: Công ty TNHH Giải Pháp Alpha
  - paragraph: OWNER
  - navigation "Điều hướng nhà tuyển dụng":
    - link "Tổng quan":
      - /url: /recruiter
    - text: Tin tuyển dụng Khóa Tìm kiếm ứng viên Khóa Đơn ứng tuyển Khóa Thành viên công ty Khóa
    - link "Hồ sơ công ty":
      - /url: /recruiter/verification
  - paragraph: Xây dựng uy tín doanh nghiệp
  - paragraph: Hoàn thiện hồ sơ để ứng viên an tâm kết nối với bạn.
  - link "Xác thực công ty":
    - /url: /recruiter/verification
  - link "Trang chủ GuardianWork":
    - /url: /vn
  - link "Dành cho ứng viên":
    - /url: /jobs
  - link "Quản trị hệ thống":
    - /url: /admin
- banner:
  - paragraph: Thiết lập tuyển dụng
  - link "Trang chủ":
    - /url: /vn
  - button "Đăng xuất"
- main:
  - region "Hồ sơ công ty đang chờ duyệt":
    - heading "Hồ sơ công ty đang chờ duyệt" [level=1]
    - paragraph: Hồ sơ đã được gửi. Các chức năng tuyển dụng sẽ mở theo trạng thái xác minh và quyền thành viên.
    - button "Tải lại trạng thái"
```

# Test source

```ts
  164 |         id: previous.id + 1,
  165 |         revisionNumber: previous.revisionNumber + 1,
  166 |         version: 0,
  167 |         state: "DRAFT",
  168 |         content: structuredClone(previous.content),
  169 |       };
  170 |       job.version++;
  171 |       job.availableActions = ["SAVE_DRAFT", "PREVIEW", "SUBMIT"];
  172 |     } else if (method === "PUT" && path.endsWith("/draft")) {
  173 |       expect(body!.expectedRevisionVersion).toBe(job.workingRevision!.version);
  174 |       job.workingRevision!.content = body!.content as JobContent;
  175 |       job.workingRevision!.version++;
  176 |       job.version++;
  177 |     } else if (path.endsWith("/submit")) {
  178 |       expect(body!.confirmed).toBe(true);
  179 |       expect(body!.expectedRevisionVersion).toBe(job.workingRevision!.version);
  180 |       job.workingRevision!.state = "PENDING_REVIEW";
  181 |       job.workingRevision!.version++;
  182 |       job.version++;
  183 |       job.availableActions = ["WITHDRAW"];
  184 |     } else if (path.endsWith("/withdraw")) {
  185 |       job.workingRevision = null;
  186 |       job.version++;
  187 |       job.availableActions = ["CREATE_DRAFT"];
  188 |     } else if (path.endsWith("/owner-responsibility")) {
  189 |       job.ownerResponsible = Boolean(body!.responsible);
  190 |       job.version++;
  191 |     } else if (path.includes("/assignments/")) {
  192 |       if (method === "PUT")
  193 |         job.assignments.push({
  194 |           id: 1,
  195 |           membershipId: 7,
  196 |           membershipJoinedAt: stamp,
  197 |           assignedAt: stamp,
  198 |         });
  199 |       else job.assignments = [];
  200 |       job.version++;
  201 |     } else if (path.endsWith("/pause")) {
  202 |       job.status = "PAUSED";
  203 |       job.availableActions = ["CREATE_DRAFT", "RESUME", "CLOSE"];
  204 |       job.version++;
  205 |     } else if (path.endsWith("/resume")) {
  206 |       job.status = "PUBLISHED";
  207 |       job.availableActions = ["CREATE_DRAFT", "PAUSE", "CLOSE"];
  208 |       job.version++;
  209 |     } else if (path.endsWith("/close")) {
  210 |       job.status = "CLOSED";
  211 |       job.availableActions = [];
  212 |       job.version++;
  213 |     } else if (path.endsWith("/revisions")) {
  214 |       if (job.workingRevision)
  215 |         histories.set(id, [
  216 |           {
  217 |             ...structuredClone(job.workingRevision),
  218 |             createdAt: stamp,
  219 |             submittedAt: job.workingRevision.state === "PENDING_REVIEW" ? stamp : null,
  220 |             decidedAt: null,
  221 |             withdrawnAt: null,
  222 |             rejectionReason: null,
  223 |           },
  224 |         ]);
  225 |       return reply(
  226 |         paged(
  227 |           histories.get(id) ?? [],
  228 |           Number(url.searchParams.get("page") || 0),
  229 |           Number(url.searchParams.get("size") || 20),
  230 |         ),
  231 |       );
  232 |     }
  233 |     job.needsReassignment = !job.ownerResponsible && !job.assignments.length;
  234 |     return reply(job);
  235 |   });
  236 |   return {
  237 |     writes,
  238 |     setConflict: () => {
  239 |       conflict = true;
  240 |     },
  241 |     getJobs: () => jobs,
  242 |     histories,
  243 |   };
  244 | }
  245 | async function noOverflow(page: Page) {
  246 |   expect(
  247 |     await page.evaluate(
  248 |       () =>
  249 |         document.documentElement.scrollWidth > innerWidth + 1 ||
  250 |         document.querySelector("main")!.scrollWidth >
  251 |           document.querySelector("main")!.clientWidth + 1,
  252 |     ),
  253 |   ).toBe(false);
  254 | }
  255 | 
  256 | test("owner creates an incomplete draft, sees validation, completes and submits the persisted revision", async ({
  257 |   page,
  258 | }, info) => {
  259 |   const mock = await mockJobs(page, []);
  260 |   await login(page, "owner_demo", true);
  261 |   await page.goto("/recruiter/jobs");
  262 |   await expect(
  263 |     page.getByRole("heading", { name: "Bắt đầu với tin tuyển dụng đầu tiên" }),
> 264 |   ).toBeVisible();
      |     ^ Error: expect(locator).toBeVisible() failed
  265 |   await page.getByRole("link", { name: "Tạo tin tuyển dụng" }).first().click();
  266 |   await page.getByLabel("Chức danh công việc", { exact: true }).fill("Chuyên viên kinh doanh");
  267 |   await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  268 |   await expect(page).toHaveURL(/jobId=83/);
  269 |   await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  270 |   await expect(page.getByText("Cần hoàn tất trước khi gửi", { exact: true })).toBeVisible();
  271 |   await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeDisabled();
  272 |   await page.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click();
  273 |   for (const [label, value] of [
  274 |     ["Giới thiệu công việc", completeContent.description],
  275 |     ["Trách nhiệm công việc", completeContent.responsibilities],
  276 |     ["Yêu cầu bắt buộc", completeContent.requiredQualifications],
  277 |     ["Yêu cầu ưu tiên", completeContent.preferredQualifications],
  278 |     ["Kinh nghiệm mong đợi", completeContent.experienceExpectations],
  279 |     ["Quyền lợi", completeContent.benefits],
  280 |     ["Hướng dẫn ứng tuyển", completeContent.applicationInstructions],
  281 |     ["Địa điểm làm việc", completeContent.location],
  282 |   ])
  283 |     await page.getByLabel(label!, { exact: true }).fill(value!);
  284 |   await page
  285 |     .getByRole("combobox", { name: "Loại công việc", exact: true })
  286 |     .selectOption("FULL_TIME");
  287 |   await page
  288 |     .getByRole("combobox", { name: "Hình thức làm việc", exact: true })
  289 |     .selectOption("ONSITE");
  290 |   await page.getByLabel("Số lượng tuyển", { exact: true }).fill("2");
  291 |   await page.getByLabel("Hạn ứng tuyển", { exact: true }).fill("2099-12-01T17:00");
  292 |   await page.getByRole("combobox", { name: "Mức lương", exact: true }).selectOption("true");
  293 |   await page.getByLabel("Lương tối thiểu", { exact: true }).fill("15000000");
  294 |   await page.getByLabel("Lương tối đa", { exact: true }).fill("25000000");
  295 |   await page.getByRole("button", { name: "Thêm câu hỏi" }).click();
  296 |   await page.getByLabel("Nội dung câu hỏi 1").fill("Bạn có thể bắt đầu khi nào?");
  297 |   await page.screenshot({
  298 |     path: `/tmp/job-publishing-${info.project.name}-editor.png`,
  299 |     fullPage: true,
  300 |   });
  301 |   await noOverflow(page);
  302 |   await page.getByRole("button", { name: "Lưu và xem trước" }).click();
  303 |   await expect(page.getByRole("button", { name: "Xác nhận gửi duyệt" })).toBeEnabled();
  304 |   await page.screenshot({
  305 |     path: `/tmp/job-publishing-${info.project.name}-preview.png`,
  306 |     fullPage: true,
  307 |   });
  308 |   await page.getByRole("button", { name: "Xác nhận gửi duyệt" }).click();
  309 |   await expect(page.getByText("Đã gửi bản tin để xét duyệt.", { exact: true })).toBeVisible();
  310 |   await expect(page.getByRole("button", { name: "Rút bản gửi duyệt", exact: true })).toBeVisible();
  311 |   await page.reload();
  312 |   await expect(page.getByText("Bản v1 đang chờ duyệt", { exact: true })).toBeVisible();
  313 |   await page.getByRole("button", { name: "Rút bản gửi duyệt", exact: true }).click();
  314 |   await page.getByRole("button", { name: "Xác nhận rút bản gửi" }).click();
  315 |   await expect(page.getByRole("button", { name: "Tạo bản chỉnh sửa" })).toBeVisible();
  316 |   const saved = mock.writes.find(
  317 |     (write) => write.method === "PUT" && write.path.endsWith("/draft"),
  318 |   );
  319 |   expect((saved!.body!.content as JobContent).screeningQuestions?.[0].prompt).toBe(
  320 |     "Bạn có thể bắt đầu khi nào?",
  321 |   );
  322 | });
  323 | 
  324 | test("assignment preserves typed content and stale edits never report success", async ({
  325 |   page,
  326 | }, info) => {
  327 |   const mock = await mockJobs(page);
  328 |   await login(page, "owner_demo", true);
  329 |   await page.goto("/recruiter/jobs?jobId=83");
  330 |   await page.getByLabel("Chức danh công việc", { exact: true }).fill("Bản sửa chưa lưu");
  331 |   await page.getByLabel("Tôi chịu trách nhiệm").click();
  332 |   await expect(
  333 |     page.getByText("Chưa có người phụ trách. Cần phân công trước khi gửi duyệt.", { exact: true }),
  334 |   ).toBeVisible();
  335 |   await page.getByLabel("Linh Trần").click();
  336 |   await expect(page.getByLabel("Linh Trần")).toBeChecked();
  337 |   await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
  338 |     "Bản sửa chưa lưu",
  339 |   );
  340 |   await expect(
  341 |     page.getByText("Chưa có người phụ trách. Cần phân công trước khi gửi duyệt.", { exact: true }),
  342 |   ).toHaveCount(0);
  343 |   mock.setConflict();
  344 |   await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  345 |   await expect(page.getByRole("alert")).toContainText("đã được người khác cập nhật");
  346 |   await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
  347 |     "Bản sửa chưa lưu",
  348 |   );
  349 |   await page.screenshot({
  350 |     path: `/tmp/job-publishing-${info.project.name}-conflict.png`,
  351 |     fullPage: true,
  352 |   });
  353 |   await page.getByRole("button", { name: "Quay lại danh sách" }).click();
  354 |   await expect(page.getByRole("alertdialog")).toBeVisible();
  355 |   await page.getByRole("button", { name: "Ở lại", exact: true }).click();
  356 |   await expect(page.getByLabel("Chức danh công việc", { exact: true })).toHaveValue(
  357 |     "Bản sửa chưa lưu",
  358 |   );
  359 |   await noOverflow(page);
  360 | });
  361 | 
  362 | test("list filters reach the API and publication controls require explicit closing confirmation", async ({
  363 |   page,
  364 | }, info) => {
```