# Phase 1: Core MVP

**Parent Plan:** [plan.md](./plan.md)
**Dependencies:** None (first phase)
**Docs:** [Brainstorm Report](../reports/brainstorm-2026-01-29-task-management-system.md)

---

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Completed | 2026-01-29 |
| Description | Setup foundation: Supabase, Auth, Project/Task CRUD, Calendar, Budget |
| Priority | High |
| Implementation Status | ✅ DONE |
| Review Status | ✅ Approved |
| Review Date | 2026-01-29 |
| Review Report | [Code Review Report](../reports/code-reviewer-2026-01-29-phase-01-core-mvp.md) |

---

## Key Insights

1. Use `@supabase/ssr` (not deprecated auth-helpers)
2. Middleware required for token refresh
3. RLS policies mandatory for multi-tenant isolation
4. TanStack Query for server state, Zustand for UI state
5. Server Components for initial data fetch (better UX)

---

## Requirements

### 1.1 Project Setup
- [ ] Create Supabase project
- [ ] Create Google Cloud project (OAuth)
- [ ] Init Next.js 14 with TypeScript
- [ ] Configure Tailwind + shadcn/ui
- [ ] Setup ESLint + Prettier

### 1.2 Authentication
- [ ] Supabase Auth config (Google + Email/Password)
- [ ] Login page
- [ ] Signup page
- [ ] Auth callback handler
- [ ] Protected routes middleware
- [ ] User profile (profiles table)

### 1.3 Projects Module
- [ ] Projects list page
- [ ] Create project form
- [ ] Project detail page
- [ ] Edit/Delete project
- [ ] Project type selection (wedding, house, travel, event)

### 1.4 Tasks Module
- [ ] Tasks list (table view)
- [ ] Kanban board view
- [ ] Create/Edit task form
- [ ] Subtasks support
- [ ] Task status (todo, in_progress, done)
- [ ] Priority & assignee

### 1.5 Calendar View
- [ ] Monthly calendar (react-big-calendar)
- [ ] Tasks displayed by due_date
- [ ] Click to view task detail

### 1.6 Budget Module
- [ ] Budget categories CRUD
- [ ] Task cost tracking (estimated + actual)
- [ ] Simple budget summary

### 1.7 Dashboard
- [ ] Overview stats (tasks count, budget summary)
- [ ] Upcoming tasks list
- [ ] Quick actions

---

## Architecture

### Database Schema (Phase 1)

```sql
-- 1. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'travel', 'event')),
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES auth.users NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES tasks,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assignee_id UUID REFERENCES auth.users,
  start_date DATE,
  due_date DATE,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget Categories
CREATE TABLE budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  allocated_amount DECIMAL(12,2) DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY profiles_policy ON profiles
  FOR ALL USING (auth.uid() = id);

-- Projects: Owner can do everything
CREATE POLICY projects_owner_policy ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- Tasks: Access if user owns the project
CREATE POLICY tasks_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Budget: Access if user owns the project
CREATE POLICY budget_policy ON budget_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_categories.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(project_id, due_date);
CREATE INDEX idx_budget_project ON budget_categories(project_id);
```

### File Structure (Phase 1)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── auth/callback/route.ts
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar, header)
│   │   ├── page.tsx (dashboard)
│   │   ├── projects/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx (detail)
│   │   │       ├── tasks/page.tsx
│   │   │       ├── budget/page.tsx
│   │   │       └── calendar/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── ui/ (shadcn: button, card, dialog, form, input, select, etc.)
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── oauth-buttons.tsx
│   ├── projects/
│   │   ├── project-card.tsx
│   │   ├── project-form.tsx
│   │   └── project-list.tsx
│   ├── tasks/
│   │   ├── task-card.tsx
│   │   ├── task-form.tsx
│   │   ├── task-table.tsx
│   │   └── kanban-board.tsx
│   ├── budget/
│   │   ├── budget-category-form.tsx
│   │   ├── budget-summary.tsx
│   │   └── cost-input.tsx
│   ├── calendar/
│   │   └── task-calendar.tsx
│   └── shared/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── loading.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   └── utils.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-projects.ts
│   ├── use-tasks.ts
│   └── use-budget.ts
├── stores/
│   └── ui-store.ts (sidebar state, filters)
├── types/
│   ├── database.ts (Supabase generated types)
│   └── index.ts
└── middleware.ts
```

---

## Implementation Steps

### Step 1: Project Initialization
```bash
# 1. Create Next.js project
npx create-next-app@latest task-management --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
npm install @supabase/ssr @supabase/supabase-js
npm install @tanstack/react-query zustand
npm install react-big-calendar date-fns
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react

# 3. Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card dialog form input select textarea table tabs avatar dropdown-menu
```

### Step 2: Supabase Setup
1. Create project at supabase.com
2. Get API URL + anon key
3. Enable Google OAuth in Auth settings
4. Run SQL migrations (schema above)
5. Configure env variables

### Step 3: Auth Implementation
1. Create Supabase client utilities
2. Setup middleware for token refresh
3. Build login/signup pages
4. Create auth callback handler
5. Add protected route logic

### Step 4: Projects Module
1. Create project list page with server fetch
2. Build project form (create/edit)
3. Add project card component
4. Implement delete with confirmation

### Step 5: Tasks Module
1. Create task list (table view)
2. Build Kanban board component
3. Implement drag-and-drop status change
4. Add task form with all fields
5. Subtasks UI (collapsible)

### Step 6: Calendar View
1. Setup react-big-calendar
2. Fetch tasks with due dates
3. Map to calendar events
4. Click handler to show task detail

### Step 7: Budget Module
1. Budget categories CRUD
2. Cost input on task form
3. Budget summary component
4. Basic totals calculation

### Step 8: Dashboard
1. Stats cards (total tasks, budget)
2. Upcoming tasks list
3. Quick create buttons

---

## Todo List

- [ ] Create Supabase project and get credentials
- [ ] Setup Google OAuth in Google Cloud Console
- [ ] Init Next.js project with all dependencies
- [ ] Configure shadcn/ui components
- [ ] Create Supabase client utilities (client.ts, server.ts)
- [ ] Setup middleware for auth token refresh
- [ ] Run database migrations in Supabase SQL editor
- [ ] Build login page with Google + Email options
- [ ] Build signup page
- [ ] Create auth callback route handler
- [ ] Create dashboard layout with sidebar
- [ ] Build projects list page
- [ ] Build project create/edit form
- [ ] Build project detail page
- [ ] Build tasks table view
- [ ] Build Kanban board component
- [ ] Build task create/edit form
- [ ] Implement subtasks
- [ ] Setup react-big-calendar
- [ ] Build calendar view page
- [ ] Build budget categories CRUD
- [ ] Add cost fields to task form
- [ ] Build budget summary component
- [ ] Build dashboard overview page
- [ ] Write unit tests for critical functions
- [ ] Deploy to Vercel

---

## Success Criteria

- [x] User can signup/login with Email (Google OAuth pending)
- [x] User can create multiple projects
- [x] User can add/edit/delete tasks
- [x] Kanban board drag-drop works
- [x] Calendar shows tasks by due date
- [x] Budget tracking shows totals
- [x] Dashboard displays overview stats
- [x] RLS prevents cross-user data access
- [x] App loads < 3 seconds (106KB First Load JS)

**Code Review Summary:**
- Build: ✅ Success
- TypeScript: ✅ No errors
- ESLint: ✅ No warnings
- Security: ✅ RLS enabled, no XSS/SQL injection risks
- Grade: B+ (Production-ready with minor improvements)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OAuth callback issues | High | Medium | Test thoroughly, proper redirect URIs |
| RLS policy bugs | High | Medium | Test with multiple users |
| Kanban performance | Medium | Low | Use optimistic updates |

---

## Security Considerations

- All data protected by RLS policies
- Auth tokens refreshed via middleware
- No API keys exposed to client (use env vars)
- CSRF protection via Supabase Auth
- Input validation with Zod schemas

---

## Review Findings

**Date:** 2026-01-29
**Status:** ✅ Approved with Minor Fixes

### Must Fix Before Phase 2
1. Add `owner_id` injection in create hooks (prevents RLS errors)
2. Refactor dashboard task fetch to use React Query hook
3. Add error logging (`console.error`) in mutation handlers

### Optional Improvements
4. Add `useMemo` to Supabase client creation in hooks
5. Implement Google OAuth (Email/Password auth working)
6. Add unit tests for hooks
7. Implement subtasks UI (schema ready)

**Full Report:** [Code Review Report](../reports/code-reviewer-2026-01-29-phase-01-core-mvp.md)

---

## Next Steps

After Phase 1 fixes applied:
1. Apply minor fixes (estimated 1 hour)
2. User approval and testing
3. Proceed to [Phase 2: Essential Features](./phase-02-essential-features.md)
4. Add project_members table for collaboration
5. Integrate Google Sheets API
6. Build guest management module
