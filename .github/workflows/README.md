# Hướng dẫn workflow CI/CD

Workflow trong thư mục này là `.github/workflows/static.yml`, có tên
**CI and deploy to Pages**. Workflow dùng Bun để kiểm tra mã nguồn, build ứng
dụng và triển khai output lên GitHub Pages.

## Khi nào workflow chạy

Workflow chạy trong các trường hợp sau:

- Push lên nhánh `main`.
- Tạo hoặc cập nhật pull request nhắm vào nhánh `main`.
- Chạy thủ công bằng **Actions → CI and deploy to Pages → Run workflow**.

## Các job

### Job `ci`

Job `ci` chạy trên `ubuntu-latest` và thực hiện:

1. Checkout mã nguồn bằng `actions/checkout`.
2. Cài Bun bằng `oven-sh/setup-bun`.
3. Cài dependency bằng `bun install --frozen-lockfile`.
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

Build của TanStack Start tạo output tĩnh tại `.output/public`. Khi workflow
chạy do push lên `main` hoặc chạy thủ công, thư mục này được upload thành
artifact có tên `pages`.

Pull request vẫn chạy toàn bộ kiểm tra và build, nhưng không upload artifact
deploy và không chạy job triển khai.

### Job `deploy`

Job `deploy` phụ thuộc vào `ci` và chỉ chạy khi:

- Sự kiện là push lên `main`; hoặc
- Workflow được chạy thủ công.

Job này:

1. Tải artifact `pages`.
2. Cấu hình GitHub Pages bằng `actions/configure-pages`.
3. Upload `.output/public` bằng `actions/upload-pages-artifact`.
4. Deploy bằng `actions/deploy-pages`.

Job deploy có các quyền cần thiết:

```yaml
contents: read
pages: write
id-token: write
```

## Cấu hình GitHub Pages

Trước lần triển khai đầu tiên, vào:

**Repository Settings → Pages → Source → GitHub Actions**

Workflow sử dụng `GITHUB_TOKEN` do GitHub Actions tự cấp. Không thêm personal
access token trực tiếp vào file workflow hoặc commit token vào repository.

## Kiểm tra bằng `act`

Cần cài [act](https://github.com/nektos/act) và Docker.

Liệt kê workflow và các job:

```sh
act --list
```

Kiểm tra job CI cho pull request mà không chạy container:

```sh
act pull_request -j ci --dryrun
```

Kiểm tra toàn bộ luồng push, gồm CI và deploy, mà không thực hiện thật:

```sh
act push -j deploy --dryrun
```

Chạy job CI thật trong Docker:

```sh
act pull_request -j ci
```

Không nên dùng `act` để deploy GitHub Pages thật. Các action Pages cần token
và thông tin cấu hình của repository trên GitHub; khi chạy local, workflow
thường sẽ dừng ở bước xác thực của `configure-pages`. `--dryrun` chỉ kiểm tra
cú pháp, điều kiện và thứ tự các bước.

## Lưu ý về output hiện tại

Lệnh `bun run build` hiện tạo `.output/public`, nhưng output không có
`index.html` ở thư mục gốc. Workflow vẫn có thể build và upload artifact thành
công, nhưng cần xác nhận cách triển khai TanStack Start/SSR này có phù hợp với
GitHub Pages tĩnh hay không. Nếu GitHub Pages yêu cầu một site tĩnh hoàn chỉnh,
cần điều chỉnh build output hoặc chọn môi trường hosting hỗ trợ SSR.
