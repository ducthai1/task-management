# Brainstorm Report: Personal Task Management System

**Date:** 2026-01-29
**Status:** Agreed
**Author:** Solution Brainstormer

---

## 1. Problem Statement

User needs an "All-in-one" personal project management tool with:
- Task management with timeline/deadline tracking
- Budget tracking (estimated vs actual costs)
- Guest management for events (wedding, parties)
- Google Sheets integration for RSVP data collection
- Multi-project support (wedding, house purchase, travel, events)
- Family collaboration with role-based access
- Offline support for unreliable network conditions

**Primary Use Case:** Wedding planning with extensibility for future projects.

---

## 2. Requirements Summary

### Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Auth** | Google OAuth + Email/Password |
| **Projects** | Multi-project with templates (4 types) |
| **Tasks** | CRUD, subtasks, assignee, status, priority, dates |
| **Timeline** | Calendar view, Gantt chart, due date alerts |
| **Budget** | Categories, estimated/actual tracking, charts |
| **Guests** | Import from Google Sheets, RSVP tracking, QR check-in |
| **Collaboration** | Invite family members, role-based permissions |
| **Offline** | PWA with local cache, background sync |

### Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Cost** | Free tier optimization (Vercel + Supabase) |
| **Users** | Family-scale (~10 concurrent users) |
| **Data** | < 500MB (fits Supabase free tier) |
| **Availability** | Offline-capable for critical operations |

---

## 3. Evaluated Approaches

### Approach A: Google Sheets as Database (Original Idea)

**Pros:**
- Familiar interface for viewing/editing data
- Native Google Forms integration
- No additional service costs

**Cons:**
- Rate limits (100 req/100sec/user)
- No ACID transactions → data conflicts
- No authentication/authorization
- No offline support
- Schema not enforced → data quality issues
- Poor query performance at scale

**Verdict:** ❌ Rejected - Too many limitations for reliable app.

---

### Approach B: Full Custom Backend (Node.js + PostgreSQL)

**Pros:**
- Full control over everything
- No vendor lock-in
- Unlimited customization

**Cons:**
- Requires server management
- Higher cost (VPS needed)
- More development time
- Need to implement auth from scratch

**Verdict:** ❌ Rejected - Overkill for personal use, higher cost.

---

### Approach C: Supabase + Google Sheets Hybrid (Recommended)

**Pros:**
- PostgreSQL as reliable source of truth
- Built-in Auth (Google + Email)
- Realtime subscriptions
- Row-level security
- 500MB free database
- 1GB free storage
- Google Sheets sync for RSVP collection

**Cons:**
- Vendor dependency on Supabase
- Free tier limits (acceptable for personal use)

**Verdict:** ✅ Selected - Best balance of features, cost, and reliability.

---

## 4. Final Recommended Solution

### Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    Next.js 14 PWA (Vercel)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │Dashboard │ │Projects  │ │  Tasks   │ │  Budget  │ │  Guests  │ │
│  │(Overview)│ │(Multi)   │ │(+Gantt)  │ │(+Charts) │ │(+Check-in)│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                           │
│  │ Timeline │ │Templates │ │ Settings │  + PWA Offline Support    │
│  │(Calendar)│ │(4 types) │ │(Profile) │                           │
│  └──────────┘ └──────────┘ └──────────┘                           │
└────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
┌────────────────────────────┐    ┌────────────────────────────┐
│       Supabase             │    │      Google Services       │
│  ┌──────────────────────┐  │    │  ┌──────────────────────┐  │
│  │ PostgreSQL (500MB)   │  │    │  │    Google Forms      │  │
│  │ - projects           │  │    │  │   (RSVP Collection)  │  │
│  │ - tasks              │  │    │  └──────────────────────┘  │
│  │ - guests             │  │    │            │               │
│  │ - budgets            │  │    │            ▼               │
│  │ - templates          │  │    │  ┌──────────────────────┐  │
│  └──────────────────────┘  │    │  │   Google Sheets      │  │
│  ┌──────────────────────┐  │    │  │  (Form Responses)    │  │
│  │ Auth (Google+Email)  │  │    │  └──────────────────────┘  │
│  └──────────────────────┘  │    │            │               │
│  ┌──────────────────────┐  │    │     Webhook/Manual Sync   │
│  │ Storage (1GB)        │  │    │            │               │
│  │ - photos, contracts  │  │    └────────────┼───────────────┘
│  └──────────────────────┘  │                 │
│  ┌──────────────────────┐  │                 │
│  │ Realtime             │◄─┼─────────────────┘
│  │ (Live updates)       │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | SSR, RSC, PWA support, Vercel optimized |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development, consistent design |
| **State** | TanStack Query + Zustand | Server state + client state, offline cache |
| **Database** | Supabase (PostgreSQL) | Free 500MB, built-in features |
| **Auth** | Supabase Auth | Google + Email, free tier generous |
| **Storage** | Supabase Storage | Free 1GB, integrated with auth |
| **PWA** | next-pwa | Service worker, offline support |
| **Charts** | Recharts | Lightweight, React-native |
| **Calendar** | react-big-calendar | Full-featured, customizable |
| **Gantt** | gantt-task-react | Lightweight alternative |
| **Hosting** | Vercel | Free tier, excellent Next.js support |

### Free Tier Limits Analysis

| Service | Limit | Expected Usage | Margin |
|---------|-------|----------------|--------|
| Supabase DB | 500MB | ~50MB | 90% |
| Supabase Auth | 50,000 MAU | ~10 | 99.9% |
| Supabase Storage | 1GB | ~200MB | 80% |
| Supabase Realtime | 200 concurrent | ~5 | 97% |
| Vercel Bandwidth | 100GB/mo | ~5GB | 95% |
| Google Sheets API | 300 req/min | ~10 req/min | 96% |

---

## 5. Database Schema

```sql
-- User profiles (extends Supabase auth.users)
profiles (id, full_name, avatar_url, created_at)

-- Multi-project support
projects (id, name, description, type, start_date, end_date,
          owner_id, settings, created_at)

-- Collaboration
project_members (id, project_id, user_id, role, invited_email, created_at)

-- Tasks with timeline
tasks (id, project_id, parent_id, title, description, status, priority,
       category, assignee_id, start_date, due_date, estimated_cost,
       actual_cost, notes, position, created_at)

-- Budget tracking
budget_categories (id, project_id, name, allocated_amount, color, created_at)

-- Guest management
guests (id, project_id, name, phone, email, group_name, invitation_sent,
        invitation_sent_at, rsvp_status, rsvp_count, table_number,
        qr_code, checked_in, checked_in_at, gift_amount, notes,
        source, external_id, created_at)

-- Project templates
templates (id, name, type, description, tasks, budget_categories,
           is_system, created_by, created_at)

-- Sync tracking
sync_logs (id, project_id, source_type, source_id, records_synced,
           status, error_message, synced_at)

-- Collaboration features
comments (id, task_id, user_id, content, created_at)
attachments (id, task_id, file_name, file_path, file_size, file_type,
             uploaded_by, created_at)
```

---

## 6. Features by Phase

### Phase 1: Core MVP
- [x] Authentication (Google + Email)
- [x] Project CRUD
- [x] Task CRUD with Kanban view
- [x] Basic Calendar view
- [x] Simple budget tracking

### Phase 2: Essential Features
- [ ] Guest management module
- [ ] Google Sheets sync (manual trigger)
- [ ] 4 project templates
- [ ] Invite family members

### Phase 3: Enhanced UX
- [ ] PWA + Offline mode
- [ ] QR code check-in
- [ ] Gantt chart view
- [ ] Budget analytics charts
- [ ] Push notifications

### Phase 4: Polish
- [ ] Comments on tasks
- [ ] File attachments
- [ ] Export to PDF
- [ ] Multi-language (optional)

---

## 7. Google Sheets Integration Flow

```
┌─────────────────┐
│  Google Form    │ ← Khách điền RSVP
│  (RSVP Survey)  │
└────────┬────────┘
         │ Auto-save
         ▼
┌─────────────────┐
│  Google Sheet   │ ← Form Responses
│  (Raw Data)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│          Two Sync Options               │
├─────────────────────────────────────────┤
│ Option A: Manual Sync Button            │
│ - User clicks "Sync from Sheet"         │
│ - App reads Sheet via API               │
│ - Upsert to guests table                │
├─────────────────────────────────────────┤
│ Option B: Auto Webhook (Advanced)       │
│ - Google Apps Script onFormSubmit()     │
│ - Webhook → Supabase Edge Function      │
│ - Auto-insert new guests                │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │ ← Source of Truth
│   (guests)      │
└─────────────────┘
```

**Recommendation:** Start with Option A (Manual Sync) for simplicity. Add Option B later if needed.

---

## 8. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase free tier exceeded | Medium | Low | Monitor usage, data cleanup |
| Google API rate limits | Low | Low | Cache responses, batch requests |
| Offline sync conflicts | Medium | Medium | Last-write-wins with conflict UI |
| Family members delete data | High | Low | Soft delete, activity log |
| Network issues at event | High | Medium | PWA offline mode critical |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Task completion tracking accuracy | 100% |
| Budget variance visibility | Real-time |
| Guest RSVP sync delay | < 5 minutes |
| Check-in success rate (offline) | 100% |
| App load time | < 3 seconds |
| Offline operation success | 95%+ |

---

## 10. Next Steps

1. **Setup Phase**
   - Create Supabase project
   - Create Google Cloud project (Sheets API)
   - Init Next.js project with TypeScript
   - Configure Tailwind + shadcn/ui

2. **Core Development**
   - Implement auth flows
   - Build project/task CRUD
   - Create basic dashboard

3. **Integration**
   - Connect Google Sheets API
   - Implement sync logic
   - Test with sample Form data

4. **Enhancement**
   - Add PWA configuration
   - Implement offline caching
   - Add QR check-in feature

---

## 11. Unresolved Questions

None - All requirements clarified.

---

## 12. Appendix: Project Templates

### Wedding Template Tasks
1. Chọn ngày cưới
2. Đặt cọc nhà hàng/venue
3. Chọn và đặt photographer
4. Chốt danh sách khách mời
5. In thiệp mời
6. Đi phát thiệp
7. Thử váy cưới/vest
8. Trang trí sân khấu
9. Chuẩn bị quà cho khách
10. Tổng duyệt

### House Purchase Template Tasks
1. Xác định ngân sách
2. Khảo sát khu vực
3. Liên hệ môi giới
4. Xem nhà (list locations)
5. Kiểm tra pháp lý
6. Đàm phán giá
7. Ký hợp đồng đặt cọc
8. Vay ngân hàng (nếu cần)
9. Ký công chứng
10. Nhận bàn giao

### Travel Template Tasks
1. Chọn điểm đến
2. Đặt vé máy bay
3. Đặt khách sạn
4. Làm visa (nếu cần)
5. Lên lịch trình chi tiết
6. Đổi tiền/mua bảo hiểm
7. Chuẩn bị hành lý
8. Checklist đồ mang theo

### Event/Party Template Tasks
1. Xác định mục đích sự kiện
2. Chọn địa điểm
3. Lên danh sách khách mời
4. Gửi thiệp mời
5. Đặt catering
6. Thuê MC/DJ
7. Chuẩn bị quà/decorations
8. Tổng duyệt
