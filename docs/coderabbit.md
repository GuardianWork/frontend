# Hướng dẫn sử dụng CodeRabbit

Tài liệu này dành cho team frontend GuardianWork: CodeRabbit là gì, nó chạy thế nào trong repo này, cách phản hồi review và cách chỉnh cấu hình an toàn.

## TL;DR

- CodeRabbit là **bot review PR** bằng AI, cài qua GitHub App. Không phải GitHub Action, không cần thêm workflow hay secret.
- Mở PR **ready for review** (không để draft) → bot tự review. Mỗi lần push thêm commit → bot review phần thay đổi mới.
- Muốn bot trả lời trong comment, phải tag `@coderabbitai` (xem [Các lệnh chat](#các-lệnh-chat)).
- CodeRabbit **không thay thế** CI, review của người, hay kiểm tra bảo mật. CI hiện tại vẫn là nguồn chính cho lint/test/type-check/build.
- Cấu hình nằm ở `.coderabbit.yaml` tại root repo. Sửa cấu hình bằng PR, không sửa trực tiếp trên `main`.

## CodeRabbit làm gì trong repo này

Khi một PR được mở hoặc cập nhật, CodeRabbit sẽ:

1. Đọc diff và mô tả PR.
2. Đăng một **walkthrough** (tóm tắt thay đổi, file đã đổi).
3. Đăng **comment inline** cho các vấn đề phát hiện được.
4. Đăng **tóm tắt high-level** trong walkthrough (không ghi vào mô tả PR).
5. Cập nhật trạng thái check `CodeRabbit` trên commit mới nhất.

CodeRabbit **không** tự sửa code, không tự merge, và trong cấu hình hiện tại cũng không chạy linter hay secret scanner.

## Quy trình dành cho developer

### 1. Trước khi mở PR

- Tạo nhánh theo mã ticket, ví dụ `GW-123-ten-ngan`.
- Chạy kiểm tra cục bộ trước khi push:

```sh
npm run lint
npm test
npx tsc --noEmit
npm run build
```

- Giữ PR nhỏ, tập trung một mục đích. PR càng nhỏ, review của bot càng chính xác và ít nhiễu.
- Ghi mô tả PR rõ: thay đổi gì, vì sao, cách kiểm tra. Nếu có ticket, ghi mã `GW-xxx` trong title hoặc mô tả.

### 2. Khi mở PR

- Bấm **Ready for review**. PR ở trạng thái **Draft sẽ bị bỏ qua** (`auto_review.drafts: false`).
- PR phải target `main`. Cấu hình hiện tại chỉ auto-review nhánh mặc định.
- Đợi check `CodeRabbit` chuyển sang trạng thái hoàn tất rồi mới đọc kết quả.

### 3. Khi đọc review

Thứ tự đọc nên là:

1. **Walkthrough** — nắm phạm vi thay đổi và các file bị ảnh hưởng.
2. **Comment inline** — đi từ file quan trọng nhất (service, route, component dùng chung).
3. **Tóm tắt** — kiểm tra xem bot có hiểu đúng mục đích PR không.

Với mỗi comment, phân loại:

| Loại | Cách xử lý |
| --- | --- |
| Bug thật, lỗi logic, rò rỉ dữ liệu | Sửa, thêm test nếu cần. |
| Gợi ý hợp lý nhưng ngoài scope PR | Trả lời, tạo ticket riêng, không mở rộng PR vô hạn. |
| Bot hiểu sai ngữ cảnh | Trả lời giải thích, tag `@coderabbitai` nếu cần phản hồi. |
| Chỉ là style/nitpick | Bỏ qua nếu không ảnh hưởng chất lượng; CI/Prettier mới là nguồn chuẩn. |

**Không apply máy móc mọi đề xuất.** Luôn đọc, hiểu, và chạy lại lint/test sau khi sửa.

### 4. Sau khi sửa

- Push commit mới → CodeRabbit tự review phần thay đổi.
- Trả lời hoặc resolve từng thread đã xử lý để người review thấy trạng thái rõ ràng.
- Nếu cần bot review lại toàn bộ: `@coderabbitai full review` hoặc `@coderabbitai review`.

## Các lệnh chat

CodeRabbit chỉ phản hồi khi được tag (do `chat.auto_reply: false`). Gõ lệnh trong comment của PR:

| Lệnh | Tác dụng |
| --- | --- |
| `@coderabbitai review` | Yêu cầu review lại PR. |
| `@coderabbitai full review` | Review lại toàn bộ thay đổi, không chỉ phần mới. |
| `@coderabbitai summary` | Tạo lại phần tóm tắt trong walkthrough. |
| `@coderabbitai configuration` | In ra cấu hình **thực tế** đang áp dụng, kèm nguồn của từng giá trị. Dùng khi nghi config không có tác dụng. |
| `@coderabbitai pause` / `@coderabbitai resume` | Tạm dừng / bật lại auto-review cho PR hiện tại. |
| `@coderabbitai resolve` | Resolve các comment của CodeRabbit (cần quyền phù hợp). |
| `@coderabbitai help` | Xem danh sách lệnh. |

Lưu ý:

- `chat.allow_non_org_members: false` → chỉ thành viên tổ chức GuardianWork mới tương tác được với bot. Collaborator bên ngoài vẫn có thể nhận review nhưng không chat được.
- Các lệnh sinh code (`generate docstrings`, `generate unit tests`, `fix comments`, `fix-ci`, resolve merge conflict) **đang tắt hoặc không được khuyến khích dùng**. Tự sửa code và tự tạo test.

## Cấu hình hiện tại

File: `.coderabbit.yaml` tại root repo. Schema: <https://coderabbit.ai/integrations/schema.v2.json>.

| Nhóm | Đang bật | Ghi chú |
| --- | --- | --- |
| Ngôn ngữ review | English (`en-US`) | Comment và tóm tắt bằng tiếng Anh. |
| Profile | `chill` | Cân bằng: bắt bug/security/maintainability, không nitpick style. |
| Auto review | Bật, bỏ qua draft, review incremental | PR phải target `main`. |
| Tóm tắt | Bật, đặt trong walkthrough | Không ghi vào mô tả PR. |
| Sequence diagram / effort estimate | Tắt | Walkthrough gọn hơn. |
| Related issues/PRs, suggested labels/reviewers | Tắt | Giảm nhiễu. |
| Tools (ESLint, markdownlint, gitleaks, semgrep, ...) | Tắt toàn bộ | Review chỉ dùng LLM; CI vẫn chạy ESLint. |
| Finishing touches | Docstrings, unit tests, simplify, autofix: tắt | `resolve_merge_conflict` và `fix_ci` vẫn đang dùng mặc định **bật**. |
| Chat | Chỉ trả lời khi tag, chỉ org member | `auto_reply: false`, `allow_non_org_members: false`. |
| Knowledge base | Web search bật; `code_guidelines` tắt | `AGENTS.md` **không** được dùng làm tiêu chí review. |

### Pre-merge checks đang dùng mặc định

Vì không có block `pre_merge_checks` trong file, CodeRabbit dùng mặc định:

- **Docstring coverage**: warning, ngưỡng 80% → có thể cảnh báo trên hầu hết PR TypeScript.
- **Title check**: warning.
- **Description check**: warning.
- **Linked issue assessment**: warning.

Nếu thấy docstring warning gây nhiễu, thêm vào `.coderabbit.yaml`:

```yaml
reviews:
  pre_merge_checks:
    docstrings:
      mode: "off"
    issue_assessment:
      mode: "off"
```

### Muốn tắt hai finishing touch còn lại

```yaml
reviews:
  finishing_touches:
    resolve_merge_conflict:
      enabled: false
    fix_ci:
      enabled: false
```

## File nào được review, file nào bị bỏ qua

CodeRabbit bỏ qua các nhóm sau (`reviews.path_filters`):

- `src/routeTree.gen.ts` — file sinh tự động bởi TanStack Router.
- Build output: `dist/`, `.output/`, `.output-staff/`, `.vinxi/`.
- Lockfile: `package-lock.json`, `pnpm-lock.yaml`, `bun.lock`, `bun.lockb`.
- Test artifacts: `test-results/`, `playwright-report/`, `coverage/`.
- File tạm/cục bộ: `*.tsbuildinfo`, `.tanstack/`, `.wrangler/`, `.idea/`, `.openidea/`, `.taste-skill/`, `.hallmark/`, `.impeccable/`.
- `node_modules/`.

Mọi file source, docs, workflow và config khác vẫn được review.

> **Không sửa `src/routeTree.gen.ts` bằng tay.** File này được sinh lại khi chạy dev/build; sửa tay sẽ bị ghi đè và không được review.

## CodeRabbit không làm gì

Để tránh hiểu nhầm:

- **Không chạy CI thay bạn.** Lint, test, type-check, build vẫn do GitHub Actions trong `.github/workflows/static.yml` đảm nhiệm.
- **Không phải công cụ bảo mật.** Toàn bộ tool như gitleaks, trufflehog, semgrep, OSV Scanner đang tắt. Không commit secret, token, `.env` thật.
- **Không thay review của người.** Bot có thể bỏ sót logic nghiệp vụ, UX, và các quyết định kiến trúc. Vẫn cần ít nhất một người review.
- **Không tự merge hay tự sửa code.** Mọi thay đổi vẫn do bạn thực hiện và chịu trách nhiệm.

## Chỉnh cấu hình an toàn

1. Tạo nhánh và sửa `.coderabbit.yaml`.
2. CodeRabbit đọc file từ **nhánh của PR đang review**, nên bạn có thể thử ngay trong PR đó.
3. Giữ comment giải thích cho các thay đổi không hiển nhiên.
4. Kiểm tra YAML hợp lệ trước khi push. Nếu dùng VS Code, dòng `# yaml-language-server: $schema=...` ở đầu file sẽ gợi ý lỗi schema.
5. Trong PR, chạy `@coderabbitai configuration` để xem cấu hình đã resolve và nguồn của từng giá trị.
6. Chỉ merge khi đã xác nhận hành vi mới đúng.

Một số lưu ý khi chỉnh:

- Xóa một key **không** có nghĩa là tắt nó. CodeRabbit sẽ quay về **giá trị mặc định**. Ví dụ xóa `pre_merge_checks` sẽ bật lại docstring check; xóa `finishing_touches.fix_ci` sẽ bật lại fix-CI.
- `tools: {}` **không** tắt toàn bộ tool. Muốn tắt phải liệt kê từng tool với `enabled: false` như file hiện tại.
- `path_filters` chỉ có mục `!...` nghĩa là "review tất cả trừ các mục này".
- `base_branches: []` nghĩa là chỉ review PR target nhánh mặc định (`main`).

## Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
| --- | --- | --- |
| Không có review | PR còn draft | Bấm **Ready for review**. |
| Không có review | Chưa cài GitHub App hoặc chưa cấp quyền repo | Nhờ admin kiểm tra installation của CodeRabbit cho org GuardianWork. |
| Không có review | PR target nhánh khác `main` | Đổi base branch hoặc bổ sung `auto_review.base_branches`. |
| Không có review | Hết quota/plan | Kiểm tra billing của org; repo private cần plan trả phí. |
| Không thấy check `CodeRabbit` | App thiếu quyền hoặc PR vừa push | Đợi vài phút, kiểm tra tab Checks; thử `@coderabbitai review`. |
| Bot không trả lời comment | Thiếu tag hoặc không phải org member | Thêm `@coderabbitai` vào comment; kiểm tra quyền thành viên. |
| Config sửa nhưng không có tác dụng | Sai tên/vị trí file, YAML lỗi, hoặc đang xem PR khác | File phải là `.coderabbit.yaml` ở root; chạy `@coderabbitai configuration` để xem cấu hình thực tế. |
| Review bỏ qua file cần xem | File khớp `path_filters` | Kiểm tra pattern và sửa trong PR cấu hình. |
| Review quá nhiễu | Profile hoặc path instructions quá rộng | Cân nhắc `profile: quiet`, thu hẹp `path_instructions`, hoặc tắt bớt pre-merge checks. |

## Lưu ý riêng của repo

- **Không force push / rebase / amend commit đã push.** Repo được kết nối với Lovable; viết lại lịch sử sẽ làm mất lịch sử phía Lovable.
- **Chỉ hỗ trợ desktop web.** Không thêm hoặc sửa layout mobile/tablet nếu task không yêu cầu. Khi review UI, kiểm tra ở 1440×1000.
- **Giữ CI xanh.** CodeRabbit không thay thế các bước lint/test/type-check/build.
- **Chạy `npm run dev`** để kiểm tra UI trước khi mở PR; đính kèm mô tả cách kiểm tra nếu thay đổi hành vi.

## Tài liệu tham khảo

- Tổng quan: <https://docs.coderabbit.ai/>
- Cấu hình YAML: <https://docs.coderabbit.ai/getting-started/yaml-configuration>
- Toàn bộ tùy chọn: <https://docs.coderabbit.ai/reference/configuration>
- Schema: <https://coderabbit.ai/integrations/schema.v2.json>
- Cài đặt GitHub App: <https://github.com/apps/coderabbitai>
