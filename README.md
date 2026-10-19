# HV-Report — functional UI prototype

Demo giao diện KPI cho Trưởng quầy và Nhân viên. Dữ liệu trong ứng dụng là dữ liệu mẫu, không kết nối POS hoặc backend.

## Chạy local

Yêu cầu Node.js 22+ và npm.

```sh
npm ci
npm run dev
```

Mở URL do Vite in ra. Tài khoản mẫu: `manager`, `staff`, `admin`; mật khẩu `demo123`. Bộ chọn vai trò ở màn hình đăng nhập quyết định giao diện demo. Đây không phải xác thực thật.

## Kiểm tra và build

```sh
npx tsc --noEmit
npm run build
```

Output tĩnh nằm trong `dist/`. Báo cáo Excel được tạo ở trình duyệt; PDF sử dụng hộp thoại in/lưu PDF của trình duyệt.

## Chia sẻ bản demo

Có thể đưa `dist/` lên static hosting như Netlify hoặc Vercel. Thiết lập build command `npm run build`, output directory `dist`. Nếu kết nối repository với hosting, mỗi lần push vào nhánh được chọn có thể kích hoạt build mới theo cấu hình dịch vụ. Nếu deploy thủ công, build lại rồi upload thư mục `dist/` mới.

Ứng dụng điều hướng bằng React state và mở từ URL gốc; tải lại trang trở về màn hình đăng nhập. Trước khi chia sẻ cho khách, kiểm tra URL trên cửa sổ ẩn danh và thao tác thử cả hai vai trò User. Không đưa dữ liệu thật hoặc khóa truy cập vào bản demo.

Repository này chỉ chứa source. Chưa có deployment công khai được thực hiện trong đợt triển khai này.
