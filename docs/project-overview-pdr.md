# Task Management System - Project Overview & PDR

**Version:** 1.0 (Phase 1 MVP)
**Last Updated:** 2026-01-29
**Status:** Phase 1 Core MVP - Complete

---

## Project Vision

Build a personal mini-ERP system for comprehensive task, project, and budget management. One-person enterprise with single-user focus. Enables tracking of projects, tasks, budgets, and calendar scheduling in a unified dashboard.

**Target User:** Individual knowledge workers needing integrated project/task/budget management.

---

## Core Modules (Phase 1)

| Module | Features | Status |
|--------|----------|--------|
| **Auth** | Google/Email login, signup, session management | ✅ Complete |
| **Projects** | Create, list, view project details | ✅ Complete |
| **Tasks** | Create, view in kanban & table, status tracking | ✅ Complete |
| **Calendar** | Visual task scheduling, date picker | ✅ Complete |
| **Budget** | Category budgets, expense tracking | ✅ Complete |
| **Dashboard** | Overview, navigation, user profile | ✅ Complete |

---

## Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.7+
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (Google OAuth, Email)
- **State Management:** TanStack Query v5, Zustand (UI state)
- **UI Framework:** shadcn/ui + Radix UI + Tailwind CSS
- **Calendar:** react-big-calendar
- **Forms:** React Hook Form + Zod validation
- **Styling:** Tailwind CSS 3.4

---

## Functional Requirements

### FR-001: Authentication
- Google OAuth login
- Email/password signup with validation
- Session persistence via cookies (SSR)
- Automatic token refresh
- Logout functionality

### FR-002: Project Management
- Create projects with name, description, dates
- List all projects with status filtering
- View project details and associated tasks
- Edit/delete project (owner only)
- RLS protection: users see only own projects

### FR-003: Task Management
- Create tasks with title, description, priority, status, due date
- Assign tasks to projects
- View tasks in kanban board (by status) and table view
- Update task status/priority/dates
- Delete tasks
- Full-text search on task title/description

### FR-004: Budget Management
- Create budget categories with limits
- Track expenses per category
- Visual progress indicators
- Monthly budget reset
- Category editing and deletion

### FR-005: Calendar View
- Display tasks on calendar by due date
- Visual date picker
- Task selection from calendar
- Month/week/day view support

### FR-006: Dashboard
- Overview of active projects/tasks
- Quick stats (project count, overdue tasks)
- User profile management
- Navigation to all modules

---

## Non-Functional Requirements

### NFR-001: Security
- Row-level security (RLS) on all tables
- User isolation via owner_id
- Secure cookie-based sessions
- No sensitive data in localStorage
- CORS properly configured

### NFR-002: Performance
- Server-side rendering for fast initial load
- TanStack Query for efficient data fetching
- Optimistic updates for responsive UX
- Memoization on heavy components
- Target: LCP < 2s, FID < 100ms

### NFR-003: Reliability
- Error boundary components
- Graceful error handling in hooks
- Retry logic on failed requests (TQ default: 3x)
- Loading states on all async operations

### NFR-004: Scalability
- Single-user focused (no multi-tenant in MVP)
- Supabase handles concurrent connections
- Prepared for phase 2 multi-tenant (tenant_id field exists)

### NFR-005: Data Integrity
- Zod schema validation on all forms
- Server-side validation (Supabase + RLS)
- Foreign key constraints in DB
- Cascade deletes for data cleanup

---

## Architecture

### Directory Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected route group
│   │   ├── projects/
│   │   ├── settings/
│   │   └── layout.tsx            # Sidebar, header layout
│   ├── auth/callback/            # OAuth callback handler
│   └── layout.tsx                # Root layout, providers
│
├── components/                   # React components
│   ├── auth/                     # Login, signup forms
│   ├── projects/                 # Project cards, forms, lists
│   ├── tasks/                    # Kanban, task cards, forms
│   ├── budget/                   # Budget forms, summaries
│   ├── calendar/                 # Calendar view
│   ├── shared/                   # Header, sidebar, loading
│   └── ui/                       # Primitives (btn, card, dialog)
│
├── hooks/                        # Data & state hooks
│   ├── use-auth.ts              # Auth status, user data
│   ├── use-projects.ts          # CRUD operations + queries
│   ├── use-tasks.ts             # CRUD operations + queries
│   ├── use-budget.ts            # CRUD operations + queries
│   └── use-toast.ts             # Toast notifications
│
├── lib/                          # Utilities & services
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase instance
│   │   ├── server.ts            # Server-side Supabase instance
│   │   └── middleware.ts        # Cookie refresh middleware
│   └── utils.ts                 # Helpers (class merging, etc)
│
├── types/
│   └── database.ts              # Generated types from Supabase
│
├── stores/
│   └── ui-store.ts              # Zustand UI state (sidebar, modals)
│
└── middleware.ts                # Next.js middleware (auth protection)
```

### Data Flow

1. **Authentication:** User logs in → OAuth/Email → Supabase Auth → Session cookie
2. **Data Fetching:** Component → Hook → TanStack Query → Supabase API → Database (RLS filters)
3. **Mutations:** Form → Hook mutation → Supabase insert/update → Cache invalidation → UI update

### State Management Strategy

- **Server State:** TanStack Query (projects, tasks, budgets)
- **UI State:** Zustand (sidebar open/close, modals, active tabs)
- **Auth State:** Supabase Auth + useAuth hook

---

## Database Schema (Core Tables)

```sql
-- Users (managed by Supabase Auth)
users (id, email, created_at)

-- Projects (owner_id = user.id for RLS)
projects (id, owner_id, name, description, start_date, end_date, status, created_at)

-- Tasks (references projects, filtered by project ownership)
tasks (id, project_id, title, description, priority, status, due_date, created_at)

-- Budget Categories
budget_categories (id, owner_id, name, limit, created_at)

-- Budget Entries (expenses)
budget_entries (id, category_id, amount, date, created_at)
```

**RLS Policy Example:**
```sql
-- Users see only their own projects
CREATE POLICY "users_see_own_projects" ON projects
  FOR SELECT USING (owner_id = auth.uid());
```

---

## Acceptance Criteria (Phase 1)

- [x] Supabase project configured with RLS policies
- [x] Next.js 15 app router setup with middleware auth
- [x] Login/signup pages with OAuth integration
- [x] Dashboard with project list and quick stats
- [x] Project CRUD operations (create, read, update, delete)
- [x] Task management with kanban and table views
- [x] Calendar view showing task due dates
- [x] Budget module with category tracking
- [x] All hooks properly typed with TypeScript
- [x] Build passes, no TS errors, no lint warnings
- [x] Mobile responsive design (Tailwind breakpoints)

---

## Known Limitations & Future Improvements

### Phase 2 (Essential Features)
- Task dependencies and subtasks
- Recurring tasks/budgets
- Notifications and reminders
- Bulk operations
- Export/import (CSV, JSON)
- Comments/collaboration (prepare structure)

### Phase 3 (Enhanced UX)
- Offline sync (PWA)
- Advanced filtering/search
- Custom dashboards
- Analytics and reporting

### Phase 4 (Polish & Scale)
- Multi-tenant support (organization management)
- Team collaboration features
- Advanced audit logging
- Performance optimization

---

## Success Metrics

- Build time: < 30s (Vercel)
- Time to interactive: < 2s (LCP)
- First paint: < 1s
- Zero security vulnerabilities (verified via OWASP checklist)
- 100% form validation coverage
- Zero unhandled promise rejections

---

## Deployment

- **Staging:** Vercel (auto-deploy from develop branch)
- **Production:** Vercel (manual deploy from main)
- **Database:** Supabase managed PostgreSQL (auto-backups)
- **Secrets:** Environment variables via `.env.local`

---

## Team & Responsibilities

**Solo Development:** One person (full-stack)
- Frontend development
- Backend API logic
- Database design
- DevOps & deployment

---

## Conclusion

Phase 1 MVP establishes a solid foundation for personal task/project/budget management. Architecture supports future scaling with multi-tenant capabilities. Code quality is B+ (good, production-ready). Phase 2 will focus on essential features like task dependencies and notifications.
