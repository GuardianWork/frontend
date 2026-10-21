# GuardianWork frontend

## Chạy với dữ liệu mẫu

Yêu cầu Node.js 22.18+ và các dependency đã cài bằng `npm install`.

```sh
npm run dev:mock
```

Nếu đang chạy `npm run dev`, nhấn `Ctrl+C` để dừng trước khi chuyển sang mock; hai chế độ dùng cùng cổng `5137`.

Mở **http://localhost:5137**. Lệnh này khởi động frontend và API mock riêng trên máy; không cần backend hay database. Mock chỉ chạy khi dùng lệnh trên. Dữ liệu mới lưu trong RAM, khởi động lại lệnh để đặt lại dữ liệu. Đăng xuất rồi đăng nhập lại để đổi tài khoản.

Mật khẩu chung cho tất cả tài khoản mẫu: **`Guardian123!`**.

| Username         | Email                    | Chọn trên màn hình đăng nhập | Role backend | Membership / dữ liệu ban đầu                        |
| ---------------- | ------------------------ | ---------------------------- | ------------ | --------------------------------------------------- |
| `candidate_demo` | `candidate@example.test` | Tôi muốn tìm việc            | `USER`       | `activeMembership: null`, mở trang tìm việc         |
| `recruiter_demo` | `recruiter@example.test` | Đăng ký công ty              | `USER`       | Chưa có công ty, mở form đăng ký công ty            |
| `owner_demo`     | `owner@example.test`     | Đăng ký công ty              | `USER`       | `OWNER` của Alpha, công ty `PENDING`                |
| `admin_demo`     | `admin@example.test`     | Chọn mục nào cũng được       | `ADMIN`      | Mở `/admin`, có hồ sơ Alpha trong hàng đợi xác minh |

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

## Chạy với backend thật

Cấu hình hiện tại dùng backend ở `http://localhost:8080`. Cần khởi động backend trước; `npm run dev` không tự tạo API mock. Nếu backend tắt, các yêu cầu đăng ký/đăng nhập sẽ báo `ECONNREFUSED` trong terminal Vite:

```sh
npm run dev
```

Nếu backend chạy ở địa chỉ khác:

```sh
VITE_API_PROXY_TARGET=http://localhost:9090 npm run dev
```

Xem `.env.example` cho cấu hình `VITE_API_BASE_URL`. Khi deploy, cần reverse proxy `/api` đến backend hoặc đặt `VITE_API_BASE_URL=https://backend.example.com/api` lúc build và cấu hình CORS ở backend. Vite proxy chỉ phục vụ môi trường phát triển.

Phiên dùng `sessionStorage`, giữ access/refresh token trong tab hiện tại và xóa khi đăng xuất. Chưa dùng cookie HttpOnly vì backend hiện trả token trong JSON. Không gửi `role: CANDIDATE` hoặc `RECRUITER` khi đăng ký. `/auth/me` là nguồn dữ liệu về tài khoản và membership.

Form công ty gửi bốn trường backend hỗ trợ: `name`, `taxCode`, `email`, `registrationCertificateUrl`. Tài liệu phải có URL http/https; chưa tích hợp tải tệp vì chưa có API upload. Các trường không được backend lưu đã được bỏ khỏi form gửi hồ sơ.

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

### Invited recruiter onboarding

The recipient flow is available at `/company-invitations`, with personal verification at `/employer-onboarding`. It uses API_FOR_FE's real invitation and member-proof contracts. See [integration and delivery configuration](docs/invited-recruiter-onboarding.md). The basic `dev:mock` server does not simulate these new endpoints; the invitation browser suite supplies isolated API fixtures. SMS delivery and phone OTP verification are owned by a separate ticket and are not implemented in this branch. Pending backend phone proof continues to block workspace entry.
