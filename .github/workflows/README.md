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

## Lưu ý về output

Lệnh `bun run build` hiện tạo output tại `.output/public`, nhưng không có
`index.html` ở thư mục gốc. CI vẫn kiểm tra build thành công, nhưng không triển
khai output này. Nếu cần deploy, nên dùng workflow triển khai riêng và xác nhận
hosting phù hợp với ứng dụng TanStack Start/SSR.
