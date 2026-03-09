# Hướng Dẫn Sử Dụng - Hệ Thống Quản Lý Dự Án

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
2. [Đăng ký & Đăng nhập](#2-đăng-ký--đăng-nhập)
3. [Dashboard](#3-dashboard)
4. [Quản lý Dự án](#4-quản-lý-dự-án)
5. [Quản lý Công việc (Tasks)](#5-quản-lý-công-việc-tasks)
6. [Quản lý Khách mời (Guests)](#6-quản-lý-khách-mời-guests)
7. [Check-in](#7-check-in)
8. [Quản lý Ngân sách (Budget)](#8-quản-lý-ngân-sách-budget)
9. [Phân tích (Analytics)](#9-phân-tích-analytics)
10. [Lịch (Calendar)](#10-lịch-calendar)
11. [Thành viên (Members)](#11-thành-viên-members)
12. [Nhật ký hoạt động (Activity Log)](#12-nhật-ký-hoạt-động-activity-log)
13. [Xuất báo cáo (Export)](#13-xuất-báo-cáo-export)
14. [Tìm kiếm nhanh](#14-tìm-kiếm-nhanh)
15. [Cài đặt & Hồ sơ](#15-cài-đặt--hồ-sơ)
16. [Phím tắt](#16-phím-tắt)

---

## 1. Giới thiệu

**TaskMgr** là hệ thống quản lý dự án sự kiện toàn diện, hỗ trợ các loại dự án: đám cưới, mua nhà, du lịch và sự kiện. Hệ thống tích hợp quản lý công việc, khách mời, ngân sách và phân tích dữ liệu trong một nền tảng duy nhất.

### Yêu cầu hệ thống
- Trình duyệt hiện đại: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Kết nối internet (khuyến nghị)
- Hỗ trợ thiết bị di động qua trình duyệt

### Hỗ trợ PWA / Offline
- Ứng dụng hỗ trợ chế độ **ngoại tuyến (offline)** — dữ liệu được lưu tạm cục bộ
- Khi mất kết nối, biểu tượng `Offline` xuất hiện trên thanh tiêu đề
- Khi có mạng trở lại, nhấn nút **đồng bộ** (biểu tượng làm mới) để tải lên các thay đổi còn chờ
- Số thay đổi chưa đồng bộ hiển thị ngay trên nút đồng bộ

---

## 2. Đăng ký & Đăng nhập

### Đăng ký tài khoản
1. Truy cập trang `/signup`
2. Nhập **email** và **mật khẩu**
3. Nhấn **Đăng ký** — hệ thống tạo tài khoản qua Supabase Auth

### Đăng nhập
1. Truy cập trang `/login`
2. Nhập email và mật khẩu đã đăng ký
3. Nhấn **Đăng nhập**

### Đăng xuất
- Nhấn vào **avatar** (góc trên phải) → chọn **Đăng xuất**

> Quên mật khẩu: liên hệ quản trị viên hoặc sử dụng chức năng reset từ trang đăng nhập (nếu được cấu hình).

---

## 3. Dashboard

Trang tổng quan hiển thị ngay sau khi đăng nhập.

### Thẻ thống kê (4 thẻ)
| Thẻ | Nội dung |
|-----|----------|
| Dự án | Tổng số dự án đang quản lý |
| Công việc | Số task đã hoàn thành / tổng số |
| Quá hạn | Số task đã quá deadline (hiển thị đỏ nếu > 0) |
| Ngân sách | Tổng thực chi / tổng dự kiến |

### Nội dung chính
- **Sắp tới**: 5 công việc có deadline trong 7 ngày tới, kèm mức ưu tiên
- **Quá hạn**: Tối đa 5 task đã trễ deadline, nền đỏ cảnh báo
- **Dự án gần đây**: 3 dự án mới nhất với thanh tiến độ
- **Thao tác nhanh**: Nút tắt đến Tạo dự án, Quản lý công việc, Xem lịch, Ngân sách

---

## 4. Quản lý Dự án

### Các loại dự án
| Loại | Biểu tượng | Mô tả |
|------|-----------|-------|
| `wedding` | Tim hồng | Đám cưới |
| `house` | Ngôi nhà | Mua nhà |
| `travel` | Máy bay | Du lịch |
| `event` | Bong bóng | Sự kiện khác |

### Tạo dự án mới
1. Nhấn **Tạo dự án** (dashboard hoặc trang `/projects`)
2. Điền thông tin:
   - **Tên dự án** (bắt buộc)
   - **Loại dự án** (wedding / house / travel / event)
   - **Mô tả** (tùy chọn)
   - **Ngày bắt đầu / kết thúc** (tùy chọn)
3. Nhấn **Lưu** → chuyển thẳng đến trang chi tiết dự án

### Áp dụng Template
- Trong trang chi tiết dự án, nhấn **Áp dụng Template**
- Chọn template phù hợp với loại dự án (bao gồm tasks và danh mục ngân sách mẫu)
- Template hệ thống có sẵn theo từng loại dự án

### Điều hướng trong dự án
Trang chi tiết dự án (`/projects/[id]`) có thanh tab:

> Tasks | Lịch | Ngân sách | Khách mời | Check-in | Thống kê | Thành viên | Hoạt động | Xuất PDF

---

## 5. Quản lý Công việc (Tasks)

### Hai chế độ hiển thị
- **Kanban** (mặc định): Cột theo trạng thái — Cần làm | Đang làm | Hoàn thành
- **Table**: Danh sách dạng bảng với đầy đủ thông tin

Chuyển đổi bằng 2 nút icon ở góc trên phải trang Tasks.

### Tạo task mới
1. Nhấn **Thêm task**
2. Điền thông tin:
   - **Tiêu đề** (bắt buộc)
   - **Mô tả**, **Ghi chú**
   - **Trạng thái**: `todo` / `in_progress` / `done`
   - **Mức ưu tiên**: `low` / `medium` / `high` / `urgent`
   - **Danh mục** (dùng cho phân loại ngân sách)
   - **Ngày bắt đầu / deadline**
   - **Chi phí dự kiến / thực tế**
   - **Người được giao**
   - **Task cha** (hỗ trợ task con / subtask)

### Thay đổi trạng thái
- **Kanban**: Kéo thả card sang cột tương ứng
- **Table**: Nhấn vào task → chỉnh sửa trạng thái

### Xem chi tiết task
Nhấn vào tên task → mở dialog chi tiết (xem comments, attachments nếu có).

### Mức ưu tiên
| Mức | Màu |
|-----|-----|
| low | Xanh lá |
| medium | Vàng |
| high | Cam |
| urgent | Đỏ |

---

## 6. Quản lý Khách mời (Guests)

### Thêm khách thủ công
1. Nhấn **Thêm khách**
2. Điền: Tên, số điện thoại, email, nhóm, số bàn, RSVP, số người đi cùng

### Thống kê khách (4 thẻ)
Tổng số khách | Đã xác nhận | Từ chối | Đã check-in

### Lọc và tìm kiếm
- Tìm theo tên, số điện thoại, email
- Lọc theo **trạng thái RSVP**: Tất cả / Chờ / Xác nhận / Từ chối
- Lọc theo **nhóm khách**

### RSVP
Trạng thái RSVP gồm 3 giá trị:
- `pending` — Chờ xác nhận
- `confirmed` — Đã xác nhận
- `declined` — Từ chối

**Cập nhật hàng loạt**: Chọn nhiều khách → nhấn **Cập nhật RSVP** → chọn trạng thái.

### Đồng bộ từ Google Sheets
1. Nhấn **Đồng bộ Google Sheets** (trang Khách mời)
2. Nhập URL hoặc ID của Google Sheets
3. Nhấn đồng bộ → hệ thống import danh sách, tự động gán `source: google_sheet`
4. Lịch sử đồng bộ lưu trong `sync_logs`

---

## 7. Check-in

Truy cập từ tab **Check-in** trong dự án (chỉ hiển thị khách có RSVP `confirmed`).

### Tìm kiếm khách
- Nhập tên, số điện thoại hoặc **số bàn** vào ô tìm kiếm

### Check-in thủ công
- Tìm khách → nhấn nút **Check-in** → trạng thái chuyển thành "Đã đến" kèm timestamp
- Nhấn **Hủy check-in** để hoàn tác

### Mã QR
- Nhấn biểu tượng QR bên cạnh tên khách → hiển thị mã QR
- Dùng thiết bị quét mã để check-in nhanh

### Ghi nhận tiền mừng
1. Nhấn vào cột **Tiền mừng** của khách
2. Nhập số tiền (VND), ví dụ: `500000` = 500,000đ
3. Nhấn **Lưu** → hiển thị dạng rút gọn (500K, 1.5M...)

### Thống kê check-in
Tổng khách | Đã check-in | Đã xác nhận | Tổng tiền mừng thu được

---

## 8. Quản lý Ngân sách (Budget)

### Danh mục ngân sách
- Tạo danh mục (tên, số tiền phân bổ, màu sắc)
- Mỗi task có thể gán vào một danh mục → tự động tổng hợp chi phí

### Theo dõi chi tiêu
| Chỉ số | Nguồn dữ liệu |
|--------|--------------|
| Ngân sách phân bổ | Tổng `allocated_amount` các danh mục |
| Dự toán | Tổng `estimated_cost` các task |
| Thực chi | Tổng `actual_cost` các task |

### Xem tổng quan
Trang Budget hiển thị bảng phân tích từng danh mục: phân bổ / dự toán / thực chi.

---

## 9. Phân tích (Analytics)

### 4 thẻ tiến độ
- **Tiến độ công việc**: done/total tasks, xanh khi hoàn thành 100%
- **Ngân sách đã dùng**: thực chi/phân bổ, vàng khi >80%, đỏ khi >100%
- **Khách đã check-in**: checkedIn/total
- **RSVP đã xác nhận**: confirmed/total

### Biểu đồ
- **Pie chart**: Tỷ lệ thực chi theo danh mục
- **Bar chart**: So sánh dự toán vs thực chi theo từng danh mục

### Tóm tắt ngân sách
3 số liệu lớn: Ngân sách phân bổ (xanh) | Dự toán (vàng) | Thực chi (xanh lá)

---

## 10. Lịch (Calendar)

- Hiển thị tất cả tasks có **ngày bắt đầu** hoặc **deadline** trên lịch tháng/tuần/ngày
- Nhấn vào một sự kiện trên lịch → mở form chỉnh sửa task
- Dùng để có cái nhìn tổng thể về timeline dự án

---

## 11. Thành viên (Members)

### Vai trò
| Vai trò | Quyền hạn |
|---------|----------|
| `owner` | Toàn quyền, mời/xóa thành viên |
| `editor` | Xem và chỉnh sửa dữ liệu |
| `viewer` | Chỉ xem |

### Mời thành viên (chỉ Owner)
1. Nhấn **Mời thành viên**
2. Nhập email người dùng cần mời
3. Chọn vai trò: editor hoặc viewer
4. Gửi lời mời → trạng thái `pending` cho đến khi chấp nhận

### Trạng thái lời mời
`pending` → `accepted` / `rejected`

> Thành viên không phải owner chỉ có thể xem danh sách, không thể quản lý thành viên khác.

---

## 12. Nhật ký hoạt động (Activity Log)

- Ghi lại toàn bộ thay đổi trong dự án: tạo, cập nhật, xóa
- Hiển thị dạng **timeline** theo thời gian (mới nhất trước)

### Lọc theo loại
Tất cả | Công việc | Khách mời | Ngân sách | Thành viên

Mỗi bản ghi gồm: người thực hiện, hành động, đối tượng, thời gian.

---

## 13. Xuất báo cáo (Export)

- Truy cập tab **Xuất PDF** trong dự án
- Chọn loại báo cáo muốn xuất (tasks, guests, budget...)
- File PDF tự động tải xuống
- Hỗ trợ in ấn khổ **A4**
- Dữ liệu là snapshot tại thời điểm xuất

---

## 14. Tìm kiếm nhanh

### Mở tìm kiếm
- Nhấn `Cmd+K` (macOS) hoặc `Ctrl+K` (Windows/Linux)
- Hoặc nhấn vào ô **Tìm kiếm...** trên thanh tiêu đề

### Cách dùng
1. Gõ từ khóa → kết quả hiển thị tức thời (debounce 300ms)
2. Tìm được: **Dự án** (theo tên, mô tả) và **Công việc** (theo tiêu đề, mô tả)
3. Mỗi loại hiển thị tối đa 5 kết quả
4. Nhấn vào kết quả → điều hướng ngay đến trang tương ứng
5. Nhấn `ESC` để đóng

---

## 15. Cài đặt & Hồ sơ

Truy cập bằng cách nhấn **avatar** → **Hồ sơ** hoặc **Cài đặt** (đường dẫn `/settings`).

> Trang Settings đang trong quá trình phát triển. Hiện tại hỗ trợ xem thông tin tài khoản (tên hiển thị, email, avatar).

---

## 16. Phím tắt

| Phím tắt | Chức năng |
|----------|----------|
| `Cmd/Ctrl + K` | Mở tìm kiếm toàn cục |
| `ESC` | Đóng dialog / tìm kiếm |

### Điều hướng sidebar
- Nhấn nút **mũi tên** (chevron) trên sidebar để thu gọn/mở rộng
- Sidebar thu gọn chỉ hiển thị icon, mở rộng hiển thị tên đầy đủ

### Loại dự án trong sidebar
Khi sidebar mở rộng, phần dưới navigation hiển thị 4 loại dự án:
Đám cưới | Mua nhà | Du lịch | Sự kiện

---

*Phiên bản tài liệu: 2026-03-09 | Hệ thống: TaskMgr v1.0 | Nền tảng: Next.js 15 + Supabase*
