# Task Management System

Hệ thống quản lý dự án sự kiện toàn diện — hỗ trợ đám cưới, mua nhà, du lịch và sự kiện.

**Tech stack:** Next.js 15 · React 19 · Supabase · TanStack React Query · shadcn/ui · Tailwind CSS

---

## Yêu cầu

- **Node.js** 18+ (khuyến nghị 20+)
- **npm** 9+
- **Tài khoản Supabase** (free tier đủ dùng): [supabase.com](https://supabase.com)

---

## Setup từ đầu (máy mới)

### Bước 1: Clone và cài dependencies

```bash
git clone <repo-url>
cd task-management
npm install
```

### Bước 2: Tạo project Supabase

1. Đăng nhập [supabase.com/dashboard](https://supabase.com/dashboard)
2. Nhấn **New Project** → đặt tên, chọn region gần bạn, tạo password
3. Đợi project khởi tạo xong (~2 phút)

### Bước 3: Chạy database migration

1. Trong Supabase Dashboard → **SQL Editor** → **New Query**
2. Mở file `supabase/COMPLETE-MIGRATION.sql`, copy toàn bộ nội dung
3. Paste vào SQL Editor → nhấn **Run**
4. Kết quả: tạo 11 tables, indexes, RLS policies, storage bucket, triggers, seed templates

> File này idempotent — chạy lại nhiều lần không lỗi.

### Bước 4: Cấu hình environment variables

```bash
cp .env.local.example .env.local
```

Mở `.env.local` và điền 2 giá trị bắt buộc (lấy từ Supabase → **Settings** → **API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

| Biến | Nơi lấy | Bắt buộc |
|------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL | Có |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | Có |
| `NEXT_PUBLIC_APP_URL` | URL app (localhost hoặc domain) | Có |
| `GOOGLE_SERVICE_ACCOUNT` | Google Cloud Console (xem bên dưới) | Không (chỉ cần nếu dùng Google Sheets sync) |

### Bước 5: Cấu hình Supabase Auth

Trong Supabase Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL**: `http://localhost:3000` (hoặc domain production)
2. **Redirect URLs** — thêm các URL sau:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?next=/reset-password
   ```
   > Nếu deploy lên domain khác, thêm thêm URL tương ứng (ví dụ `https://yourdomain.com/auth/callback`)

### Bước 6: Chạy app

```bash
npm run dev
```

Truy cập [http://localhost:3000](http://localhost:3000) → Đăng ký tài khoản → Bắt đầu sử dụng.

---

## Deploy lên Production

### Vercel (khuyến nghị)

```bash
npm i -g vercel
vercel
```

Thêm environment variables trong Vercel Dashboard → Settings → Environment Variables (cùng 3 biến như `.env.local`).

Cập nhật Supabase Auth → URL Configuration với domain production.

### Các nền tảng khác

App là Next.js 15 chuẩn, deploy được trên: Netlify, Railway, Docker, VPS bất kỳ.

```bash
npm run build
npm start
```

---

## Cấu hình Google Sheets Sync (tùy chọn)

Chỉ cần nếu muốn import khách mời từ Google Sheets:

1. Vào [Google Cloud Console](https://console.cloud.google.com)
2. Tạo project → Enable **Google Sheets API**
3. Tạo **Service Account** → tạo key JSON
4. Copy toàn bộ JSON → paste vào `GOOGLE_SERVICE_ACCOUNT` trong `.env.local`
5. Share Google Sheet với email của service account (quyền Viewer)

---

## Cấu trúc thư mục

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, signup, forgot/reset password
│   ├── (dashboard)/        # Dashboard, projects, settings
│   └── api/                # API routes (Google Sheets sync)
├── components/             # React components
│   ├── auth/               # Auth forms
│   ├── calendar/           # Calendar view (lazy loaded)
│   ├── checkin/             # Check-in components
│   ├── export/             # PDF export (lazy loaded)
│   ├── pwa/                # PWA install prompt, offline indicator
│   ├── shared/             # Header, sidebar, error boundary, search
│   ├── tasks/              # Kanban, table, task card, task form
│   └── ui/                 # shadcn/ui components
├── hooks/                  # React Query hooks (data fetching)
├── lib/                    # Supabase client, utilities
├── stores/                 # Zustand stores (UI state)
└── types/                  # TypeScript types

supabase/
├── COMPLETE-MIGRATION.sql  # ✅ Chạy file này cho DB mới
├── README.md               # Hướng dẫn migration
└── *.sql                   # Migration files cũ (tham khảo)

docs/
├── user-guide.md           # Hướng dẫn sử dụng đầy đủ
├── codebase-summary.md     # Tóm tắt codebase
├── system-architecture.md  # Kiến trúc hệ thống
└── ...
```

---

## Tính năng chính

- **Dashboard**: Tổng quan dự án, tasks sắp tới / quá hạn, ngân sách
- **Quản lý công việc**: Kanban board + Table view, drag & drop, subtasks
- **Quản lý khách mời**: RSVP, nhóm khách, import Google Sheets
- **Check-in**: Tìm kiếm, QR code, ghi nhận tiền mừng
- **Ngân sách**: Danh mục, dự toán vs thực chi
- **Phân tích**: Biểu đồ tiến độ, ngân sách, khách mời
- **Lịch**: Calendar view cho tasks (lazy loaded)
- **Thành viên**: Mời qua email, phân quyền (owner/editor/viewer)
- **Nhật ký**: Theo dõi mọi thay đổi trong dự án
- **Xuất PDF**: Báo cáo tự động
- **Tìm kiếm nhanh**: Cmd+K toàn cục
- **PWA**: Cài đặt như app, hỗ trợ offline
- **Đổi mật khẩu / Quên mật khẩu**: Flow đầy đủ

---

## Scripts

```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm start        # Production server
npm run lint     # ESLint
npm test         # Vitest
```

---

## Tài liệu

- [Hướng dẫn sử dụng](docs/user-guide.md)
- [Hướng dẫn migration DB](supabase/README.md)
