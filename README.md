# GuardianWork frontend

## Cấu hình môi trường

Sao chép `.env.example` thành `.env` và chỉnh cấu hình thực tế trong `.env`. File `.env` và các biến thể `.env.*` được Git bỏ qua; chỉ `.env.example` được đưa lên repository. Template chỉ chứa ví dụ local, không chứa thông tin đăng nhập hay khóa API.

`API_PROXY_TARGET`, `PUBLIC_FRONTEND_PORT` và `STAFF_FRONTEND_PORT` chỉ dùng phía server. Các biến bắt đầu bằng `VITE_` xuất hiện trong trình duyệt, vì vậy chỉ đặt API path và public origin vào đó; không đặt mật khẩu, token hay secret. Mỗi khi đổi port, cập nhật cả public origin tương ứng và khởi động lại hai server.

## Chạy frontend và Platform staff

Frontend chính: **http://localhost:5137**. Platform staff: **http://localhost:5138**.

```sh
# Khởi động cả hai cổng trong cùng một terminal
npm run dev
```

Nhấn `Ctrl+C` để dừng cả hai server. Nếu một server lỗi hoặc dừng, server còn lại cũng được dừng. Dừng các server đang chạy riêng trước khi dùng lệnh này để tránh trùng cổng.

Để chạy từng frontend riêng:

```sh
npm run dev:public
npm run dev:staff
```

Cả hai dùng cùng backend qua proxy `/api`. Proxy dev gắn đè header `X-Guardian-Portal` thành `staff` hoặc `public` theo mode. Header này chỉ là thông tin định tuyến từ proxy; backend vẫn phải xác thực token và quyền. Khi triển khai, gateway tin cậy cần xóa header do client gửi rồi gắn lại giá trị tương ứng. Mở cổng `5138` sẽ vào màn hình đăng nhập staff, không có đăng ký hoặc chọn vai trò. Chỉ tài khoản có role backend `STAFF` được truy cập. Đăng xuất trở về màn hình đăng nhập riêng. Phiên đăng nhập được lưu theo origin của từng cổng.

Nếu không có backend, chạy `npm run dev:mock` và `npm run dev:staff:mock` trong hai terminal; mỗi lệnh có bộ API mock độc lập trong RAM. Staff mẫu: `admin_demo` / `Guardian123!`.

Các đường dẫn `/staff` và `/admin` trên cổng chính chuyển sang cổng staff. Có thể cấu hình `VITE_STAFF_PORTAL_URL` và `VITE_PUBLIC_PORTAL_URL` trong môi trường khi triển khai trên domain riêng.

Build riêng bằng `npm run build:staff`, output `.output-staff`; `npm run preview:staff` xem bản build staff ở cổng `5138`. Build frontend chính vẫn dùng `npm run build` và output `.output`.

## Chạy với dữ liệu mẫu

Yêu cầu Node.js 22.18+ và các dependency đã cài bằng `npm install`.

```sh
npm run dev:mock
```

Nếu đang chạy `npm run dev`, nhấn `Ctrl+C` để dừng trước khi chuyển sang mock; hai chế độ dùng cùng cổng `5137`.

Mở **http://localhost:5137**. Lệnh này khởi động frontend và API mock riêng trên máy; không cần backend hay database. Mock chỉ chạy khi dùng lệnh trên. Dữ liệu mới lưu trong RAM, khởi động lại lệnh để đặt lại dữ liệu. Đăng xuất rồi đăng nhập lại để đổi tài khoản.

Mật khẩu chung cho tất cả tài khoản mẫu: **`Guardian123!`**.

| Username         | Email                    | Chọn trên màn hình đăng nhập | Role backend | Membership / dữ liệu ban đầu                                    |
| ---------------- | ------------------------ | ---------------------------- | ------------ | --------------------------------------------------------------- |
| `candidate_demo` | `candidate@example.test` | Tôi muốn tìm việc            | `USER`       | `activeMembership: null`, mở trang tìm việc                     |
| `recruiter_demo` | `recruiter@example.test` | Đăng ký công ty              | `USER`       | Chưa có công ty, mở form đăng ký công ty                        |
| `owner_demo`     | `owner@example.test`     | Đăng ký công ty              | `USER`       | `OWNER` của Alpha, công ty `PENDING`                            |
| `admin_demo`     | `admin@example.test`     | Đăng nhập cổng 5138          | `STAFF`      | Mở `/staff` ở cổng 5138, có hồ sơ Alpha trong hàng đợi xác minh |

Có thể đăng nhập bằng username hoặc email. Tài khoản đăng ký mới luôn có role `USER`.

### Dữ liệu để tạo công ty mới

Đăng nhập `recruiter_demo`, chọn **Đăng ký công ty**, nhập:

| Trường                 | Giá trị mẫu                                      |
| ---------------------- | ------------------------------------------------ |
| Tên công ty            | Công ty TNHH Giải Pháp Beta                      |
| Mã số thuế             | `0317654321`                                     |
| Email công ty          | `contact@beta.example.test`                      |
| Đường dẫn giấy đăng ký | `http://localhost:5137/api/mock/certificate.pdf` |

Gửi thành công sẽ tạo công ty `PENDING`; `/auth/me` trả membership `OWNER` cho tài khoản đó. Tài khoản vẫn có role `USER`. Mỗi tài khoản có tối đa một membership đang hoạt động. Giấy PDF mẫu ghi rõ là tài liệu minh họa.

Công ty Alpha có sẵn: ID `101`, MST `0101234567`, email `contact@alpha.example.test`, owner `owner_demo`. Dùng MST/email khác Alpha khi tạo công ty mới.

### Các tình huống có thể thử

- Đăng ký tài khoản mới rồi đăng nhập ở luồng tìm việc hoặc đăng ký công ty.
- Nhập sai mật khẩu để xem lỗi đăng nhập; đăng ký trùng email/username để xem lỗi trùng tài khoản.
- Tạo công ty bằng `recruiter_demo`; kiểm tra tên công ty và quyền `OWNER` ở thanh điều hướng.
- Đăng nhập admin, mở **Xác minh công ty**, phê duyệt hoặc từ chối hồ sơ mẫu. Đăng nhập lại owner để nhận trạng thái mới; hồ sơ bị từ chối có thể sửa và gửi lại.
- Làm mới trang để khôi phục tài khoản từ `/auth/me`.
- Frontend tự đổi token khi hết hạn hoặc khi API trả 401. Mock phát access token có hạn 15 phút, refresh token chỉ dùng một lần; đăng xuất thu hồi refresh token và xóa cả hai token trên frontend.

Các màn hình khác có thể vẫn dùng dữ liệu minh họa trong ứng dụng. API mock chỉ mô phỏng hợp đồng API; không phải kiểm chứng kết nối backend thật.

## Job publishing and assignment (GW-83)

The recruiter workspace at `/recruiter/jobs` uses the authenticated backend endpoints documented in `api-docs.json` and implemented in `../API_FOR_FE/backend`. Configure the existing API proxy for that backend; job data is not saved in browser-local company records.

- Owners see company jobs and manage recruiter assignments or their own responsibility. Recruiters see only their assigned jobs; creation assigns responsibility according to the backend rules.
- Save an incomplete draft, then use **Lưu và xem trước** to check the saved revision against server validation. **Xác nhận gửi duyệt** submits that exact job/revision version. Publication requires staff approval, a verified eligible company, a responsible person, complete content, and a future application deadline.
- Published content and working revisions are shown separately. Review history includes rejection reasons. Withdraw a pending revision before creating a replacement draft. Pause, resume, and close follow the API's available actions; closing is final.
- Concurrent updates retain the user's unsaved text and offer an explicit reload. Save or copy changes before replacing them with server data. Dates are entered in the device's local time and sent as ISO timestamps.

The candidate browser retains its separate sample/local data flow. The staff jobs screen now uses the review APIs described below. The general `dev:mock` server does not implement job endpoints. The dedicated browser tests intercept them with isolated contract fixtures:

```sh
npx playwright test tests/ui/job-publishing.spec.ts
```

These tests cover desktop/mobile creation, incomplete-content validation, preview/submission, withdrawal, assignment, conflicts, publication controls, and permission/error states. Live-backend end-to-end verification requires a running backend with eligible company memberships and staff review data.

## Chạy với backend thật

Cấu hình hiện tại dùng backend ở `http://localhost:8080`. Cần khởi động backend trước; `npm run dev` không tự tạo API mock. Nếu backend tắt, các yêu cầu đăng ký/đăng nhập sẽ báo `ECONNREFUSED` trong terminal Vite:

```sh
npm run dev
```

Nếu backend chạy ở địa chỉ khác:

```sh
API_PROXY_TARGET=http://localhost:9090 npm run dev
```

Xem `.env.example` cho cấu hình `VITE_API_BASE_URL`. Khi deploy, cần reverse proxy `/api` đến backend hoặc đặt `VITE_API_BASE_URL=https://backend.example.com/api` lúc build và cấu hình CORS ở backend. Vite proxy chỉ phục vụ môi trường phát triển.

Phiên dùng `sessionStorage`, giữ access/refresh token trong tab hiện tại và xóa khi đăng xuất. Chưa dùng cookie HttpOnly vì backend hiện trả token trong JSON. Không gửi `role: CANDIDATE` hoặc `RECRUITER` khi đăng ký. `/auth/me` là nguồn dữ liệu về tài khoản và membership.

Form công ty gửi bốn trường backend hỗ trợ: `name`, `taxCode`, `email`, `registrationCertificateUrl`. Tài liệu phải có URL http/https; chưa tích hợp tải tệp vì chưa có API upload. Các trường không được backend lưu đã được bỏ khỏi form gửi hồ sơ.

## Run real AI analysis locally

The recruiter JD analyzer (`/rec/jobs`) and Candidate Copilot (`/can/copilot`) need the real backend and a separate AI adapter. `npm run dev` starts the frontend portals only. `npm run dev:mock` uses in-memory fixtures and does not verify database persistence or real model analysis.

### Prerequisites and configuration

Use the sibling checkout layout `frontend/`, `guard-work/`, and `crawler/`. You need Node.js 22.18+, Java 25, Docker with the existing PostgreSQL 18 development database, and the crawler's prepared Python virtual environment at `crawler/.venv/`. Neo4j must be running with the imported Labor Code corpus and the `legal_chunk_text` index online. Configure working Gemini or NVIDIA credentials in the crawler environment; keep secrets out of frontend `VITE_` variables and committed files.

From `frontend/`, prepare the shared AI configuration once:

```sh
cd ../guard-work
# Preserve an existing local configuration.
test -f ai/.env.local || cp ai/.env.example ai/.env.local
```

Edit `guard-work/ai/.env.local` to set `GUARDWORK_AI_LEGAL_SNAPSHOT` to the identifier of the actual imported corpus. The template placeholder is rejected. Keep `GUARDWORK_AI_PROFILE` consistent between backend and adapter; change it after provider/model, prompt, or retrieval changes. An optional `LLM_BACKEND` selects `gemini` or `nvidia`. If setting `GUARDWORK_AI_SHARED_KEY`, both processes must load the same value. Both startup commands below load this file; explicit process environment values take precedence for the backend.

See the backend's [local AI setup](../guard-work/docs/backend/legal-chat.md) and [JD scanning contract](../guard-work/docs/backend/jd-scanning.md) for dependency setup and configuration details.

### Start the services

Each terminal below starts from `frontend/`. Leave the adapter, backend and frontend terminals running. Reuse already-running services with matching configuration rather than starting a second instance on the same port.

1. Start the existing database in a setup terminal:

   ```sh
   cd ../guard-work/backend
   docker compose up -d
   ```

   Start your existing Neo4j service too. On the development machine documented by the backend, its command is `sudo systemctl start neo4j`. Preserve the existing database volumes and imported corpus.

2. In the adapter terminal, run preflight, then start real analysis:

   ```sh
   cd ../guard-work
   bash ai/run-local.sh check
   bash ai/run-local.sh adapter
   ```

   Preflight should report `status: ready` and `mode: crawler`. It checks dependencies and retrieval setup without a model call; provider availability is verified by the E2E test below.

3. In the backend terminal:

   ```sh
   cd ../guard-work
   bash ai/run-local.sh backend
   ```

   The API runs on `http://localhost:8080`. On a fresh database, this starts Flyway migrations, allowing the seed service to finish. In the setup terminal (`guard-work/backend`), check `docker compose logs --tail 50 seed` and wait for `Local mock data ready` before logging in. Existing seeded passwords are preserved.

4. In the frontend terminal:

   ```sh
   npm run dev
   ```

   The public portal runs on `http://localhost:5137`; Staff runs on `http://localhost:5138`. The default API proxy target is `http://localhost:8080`.

5. Check the adapter from another terminal:

   ```sh
   curl --fail --silent --show-error http://127.0.0.1:8011/health
   ```

   Expect `status: ready`, `mode: crawler`, and the same `profile` and `legalSnapshot` configured for the backend. A healthy adapter alone does not prove a successful model response.

### Verify the E2E flow

For an automated live smoke test, run from `frontend/`:

```sh
cd ../guard-work
python3 -B -m ai.smoke --require-real --wait-seconds 720
```

This logs in as the local `demo_owner`, creates a synthetic private JD draft in PostgreSQL, requests real analysis, polls for completion, and verifies that repeating the request reuses the persisted result. It prints the new job ID and report. Every invocation creates a new draft; it never submits or publishes it. Real provider calls may incur charges. If the demo password was changed, supply it through the `GUARDWORK_SMOKE_PASSWORD` environment variable. Add `--chat` to also verify a real Candidate legal-chat response with grounded citations.

For the desktop browser flow:

1. Open `http://localhost:5137/login?role=recruiter` and log in as `demo_owner`. Newly seeded local accounts use `GuardWork123!`, which differs from the frontend mock password.
2. Open `/rec/jobs?jobId=<job ID printed by the smoke test>`. The manually seeded fixture [JD #118](http://localhost:5137/rec/jobs?jobId=118) is also available in the current development database; its ID is not portable to a fresh database.
3. On **Bản mới nhất**, click **Kiểm tra nội dung với AI**. Expect queued/running feedback, then a finding count, highlighted passages, and expanded analysis below each affected passage. Reusing a completed result may finish immediately.
4. Open **Soạn tin**. The description editor shows current findings as highlights; hover or focus a marked passage to see the analysis popup and citations.
5. Edit the description. Stale highlights should clear immediately. After five seconds without typing, the draft saves and a new analysis is requested. Wait for completion; updated highlights should match the newly saved content. Switching back to **Bản mới nhất** should show the corresponding current results.
6. Optionally log in as `demo_candidate`, open `/can/copilot`, and ask a Labor Code question to check the chat path. Accounts are separate from the `owner_demo` / `candidate_demo` frontend mock fixtures.

The synthetic JD includes retention of the worker's original CCCD and a 3,000,000 VND deposit requirement. The live verification on 2026-11-14 returned two findings with grounded citations, and the browser showed both JD highlights and editor popups without runtime errors. Model output can vary; grounded quotations still have `UNVERIFIED` temporal applicability and do not constitute a compliance decision.

### Troubleshoot AI analysis

| Symptom                                                     | Check and recovery                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ADAPTER_UNAVAILABLE` or analysis becomes failed            | Check `http://127.0.0.1:8011/health`. Start `bash ai/run-local.sh adapter` from `guard-work/` if the adapter is stopped. The backend retries transient failures up to three attempts before a terminal failure.                                        |
| The same failed result returns after restarting the adapter | Failed scans are immutable and reused for identical input and analysis identity. Make a meaningful change to the draft and analyze again. A retry on unchanged content does not create a fresh run. Do not delete scan history or alter database rows. |
| HTTP 503 / AI feature disabled                              | Start the backend with `bash ai/run-local.sh backend` and confirm real-mode configuration. For chat, also check provider availability and adapter response validity.                                                                                   |
| `mode: stub` or a trial-mode notice                         | Stub verifies plumbing and intentionally supplies no real findings. Use the shared real-mode startup commands and require `--require-real` in smoke tests.                                                                                             |
| Health passes but real analysis fails                       | Check provider credentials/model access, Neo4j/corpus/index readiness, matching shared key, profile and snapshot, and backend/adapter logs. Redact tokens and credentials before sharing logs.                                                         |
| HTTP 401/403 or missing fixture                             | Use the real local account, verify its active Company membership/access, and wait for database seeding. JD #118 belongs to the demo owner's Company.                                                                                                   |
| Old highlights disappear while editing                      | Expected: findings apply to an exact saved input. Wait five idle seconds for saving and the new request, then wait for AI completion.                                                                                                                  |

The diagnosed outage on JD #118 was a stopped adapter on port 8011. Scan #11 exhausted three connection attempts and remained failed. Starting the adapter and changing only the synthetic draft produced scan #12, which completed with two findings. This is why both service health and a fresh-input E2E request matter when testing recovery.

## Kiểm tra

```sh
npm test
npx tsc --noEmit
npm run build
```

### Kiểm tra UI bằng trình duyệt

Cài Chromium một lần:

```sh
npx playwright install chromium
```

Dừng frontend đang chạy trên cổng 5137 trước khi dùng:

```sh
npm run test:ui
```

Bộ test tự chạy frontend mock và kiểm tra desktop/điện thoại: nhập dữ liệu, đổi hành trình, đăng nhập, tìm kiếm, chỉnh sửa hồ sơ, đăng ký công ty, phân quyền chỉ xem, lọc bảng quản trị và xử lý lỗi API. Các thao tác ghi đi vào mock riêng của từng test, không ghi vào backend thật.

Để kiểm tra frontend đang chạy sẵn:

```sh
UI_BASE_URL=http://localhost:5137 npm run test:ui
```

Vite dùng cache riêng theo lệnh và chế độ chạy để `dev`, `dev:mock` và `build` không ghi đè các module React của nhau. Nếu tab đã mở trước khi đổi cấu hình, tải lại trang.

## Staff company verification

Staff dùng `/api/staff/companies/verifications`, lịch sử `/api/staff/companies/{id}/verification-history` và quyết định `PUT /api/staff/companies/{id}/verify`. Cả phê duyệt và từ chối gửi `expectedVersion`; sau xung đột hoặc mất phản hồi, tải lại danh sách và mở lại hồ sơ trước khi quyết định tiếp. Lịch sử rỗng vẫn cho phép xét duyệt hồ sơ cũ. Tải tài liệu nội bộ qua authenticated fetch; URL ngoài không nhận bearer token.

Với backend thật và local demo seed, đăng nhập `demo_staff` / `GuardWork123!`. Mock vẫn dùng tài khoản và mật khẩu mock được liệt kê ở trên.

Khi triển khai Staff, dùng API cùng origin (`VITE_API_BASE_URL=/api`) và cấu hình gateway theo [`deploy/staff-gateway.conf`](deploy/staff-gateway.conf). Include snippet trong HTTPS server block Staff, thay backend upstream cho đúng môi trường và kiểm tra `nginx -t` trước khi reload. Gateway giữ nguyên `/api` và **ghi đè** `X-Guardian-Portal: staff`, kể cả khi client tự gửi header khác. Gateway của public portal phải ghi đè thành `public`. Header chỉ cung cấp ngữ cảnh; backend vẫn phải kiểm tra Platform role `STAFF` trong token. Không trỏ trình duyệt trực tiếp đến backend để thay thế gateway này.

Hợp đồng backend được cung cấp cho lần tích hợp này tham chiếu `docs/software-requirements/auth/portal-routing-contract.md`; file đó không có trong repository frontend. Việc triển khai gateway và smoke test với backend/demo seed thật cần được thực hiện trong môi trường triển khai tương ứng.

## Staff job review

`/staff/jobs` loads `/api/staff/job-revisions` with server-side status filtering and pagination. Opening a revision fetches its current details and paginated `/api/staff/jobs/{jobId}/revisions` history. Approve/reject uses `PUT /api/staff/job-revisions/{id}/decision` with both inspected version numbers. Rejection requires 10–1,000 characters. Failed or uncertain decisions retain the reason and require a fresh inspection before another attempt.

Approval eligibility comes from the backend. An approved revision is distinct from the job's publication status (for example, a paused job stays paused). The API does not expose staff hide/restore actions, AI findings, company names, or a keyword search, so this screen shows company IDs and the supported review controls.

Run `npm run dev` with the real backend configured to use the staff portal at `http://localhost:5138/staff/jobs`. `dev:staff:mock` is for isolated testing; it does not implement job-review endpoints. Contract tests intercept those endpoints without writing decisions to a real backend:

```sh
npx playwright test tests/ui/job-approvals.spec.ts
```

Staff jobs also exposes the restored illustrative AI/legal review on the same screen below the approval queue. This reuses `JobManagementPanel` and local sample findings with official Labour Code reference links. The API-backed approval queue remains separate; the staff API still provides no live AI scan endpoint.

The recruiter `/rec/jobs` detail screen uses persisted, revision-specific backend AI scans, with findings in the current JD and description editor. Follow **Run real AI analysis locally** above to exercise that flow. Staff illustrative/local review remains separate from these real recruiter scan results. AI analysis does not submit, publish, or approve a job.
