# Hướng dẫn workflow CI

Workflow trong thư mục này là `.github/workflows/static.yml`, có tên
**Continuous Integration**. Workflow dùng Bun để cài dependency và xác minh
chất lượng mã nguồn bằng lint, test, type-check và build.

## Khi nào workflow chạy

Workflow chạy trong các trường hợp sau:

- Push lên nhánh `main`.
- Tạo hoặc cập nhật pull request nhắm vào nhánh `main`.
- Chạy thủ công bằng **Actions → Continuous Integration → Run workflow**.

## Job `ci`

Job `ci` chạy trên `ubuntu-latest` và thực hiện:

1. Checkout mã nguồn bằng `actions/checkout`.
2. Cài Bun bằng `oven-sh/setup-bun`.
3. Cài dependency bằng:
   ```sh
   bun install
   ```
4. Chạy lint:
   ```sh
   bun run lint
   ```
5. Chạy test:
   ```sh
   bun test
   ```
6. Kiểm tra TypeScript:
   ```sh
   bunx tsc --noEmit
   ```
7. Build production:
   ```sh
   bun run build
   ```

Nếu bất kỳ bước nào thất bại, job CI thất bại và workflow dừng. Workflow không
upload artifact và không triển khai GitHub Pages.

## Kiểm tra bằng `act`

Cần cài [act](https://github.com/nektos/act) và Docker.

Liệt kê workflow và job:

```sh
act --list
```

Kiểm tra job CI cho pull request mà không chạy container:

```sh
act pull_request -j ci --dryrun
```

Chạy job CI thật trong Docker:

```sh
act pull_request -j ci
```

`--dryrun` chỉ kiểm tra cú pháp, điều kiện và thứ tự các bước. Để kiểm tra
toàn bộ lệnh lint, test, type-check và build, cần chạy job thật.

## Workflow deploy Render

File `.github/workflows/deploy.yml` có tên **Deploy to Render**. Workflow này
triển khai hai portal (public và staff) lên Render.

### Khi nào workflow chạy

- Khi một GitHub Release được publish (triển khai tự động theo bản phát hành).
- Chạy thủ công bằng **Actions → Deploy to Render → Run workflow**.

### Job `verify`

Chạy lint, test, type-check và build cả hai portal với `NITRO_PRESET=node-server`
để đảm bảo build phù hợp với Render trước khi triển khai.

### Job `deploy`

Kích hoạt deploy hook của Render cho từng portal:

- `RENDER_DEPLOY_HOOK_PUBLIC`
- `RENDER_DEPLOY_HOOK_STAFF`

Cần cấu hình hai secret này trong GitHub repository settings. Deploy hook lấy từ
Render Dashboard của từng service (**Settings → Deploy Hook**).

### Cấu hình Render

File `render.yaml` ở thư mục gốc định nghĩa hai web service Render:

- `guardwork-public`: build `npm ci && NITRO_PRESET=node-server npm run build`,
  start `node .output/server/index.mjs`.
- `guardwork-staff`: build `npm ci && NITRO_PRESET=node-server npm run build:staff`,
  start `node .output-staff/server/index.mjs`.

Các biến môi trường cần thiết (ví dụ `VITE_API_BASE_URL=/api`,
`VITE_PUBLIC_PORTAL_URL`, `VITE_STAFF_PORTAL_URL`) đặt trong Blueprint hoặc tab
Environment của từng service. Node version đặt qua biến `NODE_VERSION=22`.

Trong Render Dashboard, nên tắt auto-deploy từ Git để việc triển khai chỉ xảy ra
khi workflow này chạy (theo bản phát hành). Deploy hook của mỗi service dùng cho
workflow GitHub Actions.
## Lưu ý về output

Lệnh `bun run build` hiện tạo output tại `.output/public`, nhưng không có
`index.html` ở thư mục gốc. CI vẫn kiểm tra build thành công, nhưng không triển
khai output này. Nếu cần deploy, nên dùng workflow triển khai riêng và xác nhận
hosting phù hợp với ứng dụng TanStack Start/SSR.
