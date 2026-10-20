# Hướng dẫn workflow CI/CD


Workflow trong thư mục này là `.github/workflows/static.yml`, hiện có tên
**Deploy static content to Pages**. Workflow dùng Bun để cài dependency, build
ứng dụng và triển khai output lên GitHub Pages.

## Khi nào workflow chạy

Workflow chạy trong các trường hợp sau:

- Push lên nhánh `main`.
- Tạo hoặc cập nhật pull request nhắm vào nhánh `main`.
- Chạy thủ công bằng **Actions → CI and deploy to Pages → Run workflow**.

## Các job

### Job `ci`

Job `ci` chạy trên `ubuntu-latest` và thực hiện các bước:

1. Checkout mã nguồn bằng `actions/checkout`.
2. Cài Bun bằng `oven-sh/setup-bun`.
3. Cài dependency bằng:
   ```sh
   bun install
   ```
4. Build production bằng:
   ```sh
   bun run build
   ```

Build của TanStack Start tạo output tại `.output/public`. Thư mục này được
upload thành artifact có tên `pages` cho mọi loại sự kiện của workflow.

Pull request cũng chạy bước cài dependency, build và job triển khai. Nghĩa là
thay đổi trong pull request có thể được deploy lên GitHub Pages production.

### Job `deploy`

Job `deploy` phụ thuộc vào `ci` và chạy sau khi job này thành công. Vì workflow
được kích hoạt bởi push, pull request và workflow thủ công, cả ba loại sự kiện
đều có thể triển khai lên GitHub Pages production.

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

Quyền mặc định ở cấp workflow hiện cũng bao gồm `pages: write` và `id-token:
write`; job deploy khai báo lại các quyền này để thể hiện rõ quyền cần cho bước
triển khai.

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

## Lưu ý về output, quyền và cú pháp

Lệnh `bun run build` hiện tạo `.output/public`, nhưng output không có
`index.html` ở thư mục gốc. Workflow vẫn có thể build và upload artifact thành
công, nhưng cần xác nhận cách triển khai TanStack Start/SSR này có phù hợp với
GitHub Pages tĩnh hay không. Nếu GitHub Pages yêu cầu một site tĩnh hoàn chỉnh,
cần điều chỉnh build output hoặc chọn môi trường hosting hỗ trợ SSR.

Workflow hiện cấp quyền `pages: write` và `id-token: write` ở cấp deploy để
đăng nhập và triển khai GitHub Pages. Vì pull request cũng được phép deploy,
chỉ nên bật cấu hình này nếu repository không nhận pull request không đáng tin
cậy hoặc từ fork. Pull request từ fork có thể bị GitHub hạn chế quyền ghi và
không phù hợp để deploy production.
