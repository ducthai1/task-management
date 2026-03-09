# Codebase Summary

**Last Updated:** 2026-01-29
**Total LoC:** ~3,300 (components only)
**Files:** 81 total
**Language:** TypeScript 5.7
**Framework:** Next.js 15 + React 19

---

## Quick Navigation

- **App Routes:** `/src/app` (Next.js 15 App Router)
- **Components:** `/src/components` (Feature-based organization)
- **Data Layer:** `/src/hooks` (TanStack Query + Supabase)
- **Utilities:** `/src/lib` (Supabase, helpers)
- **Types:** `/src/types/database.ts` (Auto-generated from Supabase)
- **Config:** `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`

---

## Module Breakdown

### 1. Authentication (`/src/app/(auth)`)

| File | Purpose | Lines |
|------|---------|-------|
| `login/page.tsx` | Login form with email/Google OAuth | ~50 |
| `signup/page.tsx` | Signup form with validation | ~50 |
| `app/auth/callback/route.ts` | OAuth callback handler | ~20 |
| `/src/components/auth/login-form.tsx` | Reusable login form | ~80 |
| `/src/components/auth/signup-form.tsx` | Reusable signup form | ~100 |

**Key Points:**
- Uses Supabase Auth with @supabase/ssr
- Cookie-based session management
- Middleware validates auth on protected routes
- Google OAuth configured

**State Hook:** `useAuth` - provides user, loading, signOut

---

### 2. Dashboard & Navigation (`/src/app/(dashboard)`)

| File | Purpose |
|------|---------|
| `layout.tsx` | Sidebar, header, toast provider |
| `page.tsx` | Dashboard overview (stats) |
| `projects/page.tsx` | Project list view |
| `projects/new/page.tsx` | Create project form |
| `projects/[id]/page.tsx` | Project detail view |

**Components Used:**
- `Header` - Top navigation with user menu
- `Sidebar` - Route navigation (projects, tasks, budget, calendar)
- `Loading` - Skeleton loading states

**UI State:** Zustand store manages sidebar collapse, active modals

---

### 3. Projects Module (`/src/components/projects`)

| File | Purpose |
|------|---------|
| `project-list.tsx` | List with filtering, pagination |
| `project-card.tsx` | Card display with quick actions |
| `project-form.tsx` | Form for create/edit (Zod validation) |

**Hook:** `useProjects`
```typescript
- useProjectsQuery() // Fetch all projects
- useCreateProject() // Create new project
- useUpdateProject() // Update existing
- useDeleteProject() // Soft delete
```

**Data Shape:**
```typescript
Project {
  id: uuid
  owner_id: uuid (from auth)
  name: string
  description: string
  start_date: date
  end_date: date
  status: "active" | "completed" | "on-hold"
  created_at: timestamp
}
```

---

### 4. Tasks Module (`/src/components/tasks`)

| File | Purpose |
|------|---------|
| `kanban-board.tsx` | Drag-drop board by status (Tailwind) |
| `task-table.tsx` | Table view with sorting/filtering |
| `task-card.tsx` | Individual task display |
| `task-form.tsx` | Create/edit form with Zod |

**Routes:**
- `/projects/[id]/tasks` - List tasks in project
- Task editing via modal form

**Hook:** `useTasks`
```typescript
- useTasksQuery(projectId)
- useCreateTask()
- useUpdateTask()
- useDeleteTask()
```

**Data Shape:**
```typescript
Task {
  id: uuid
  project_id: uuid
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "todo" | "in-progress" | "done"
  due_date: date
  created_at: timestamp
}
```

---

### 5. Budget Module (`/src/components/budget`)

| File | Purpose |
|------|---------|
| `budget-summary.tsx` | Overview with progress bars |
| `budget-category-form.tsx` | Add/edit budget category |

**Route:** `/projects/[id]/budget`

**Hook:** `useBudget`
```typescript
- useBudgetQuery(projectId)
- useCreateBudgetCategory()
- useUpdateBudgetEntry()
```

**Data Shape:**
```typescript
BudgetCategory {
  id: uuid
  owner_id: uuid
  project_id: uuid
  name: string
  limit: number
  created_at: timestamp
}

BudgetEntry {
  id: uuid
  category_id: uuid
  amount: number
  date: date
}
```

---

### 6. Calendar Module (`/src/components/calendar`)

| File | Purpose |
|------|---------|
| `task-calendar.tsx` | react-big-calendar integration |

**Route:** `/projects/[id]/calendar`

**Features:**
- Task visualization by due_date
- Click to view task details
- Month/week/day view toggle
- Color coding by priority

---

### 7. UI Components (`/src/components/ui`)

**shadcn/ui primitives** (16 components):
- button, card, dialog, dropdown-menu
- alert-dialog, avatar, badge, label
- separator, select, tabs, textarea
- input, skeleton, toast, toaster

All use Radix UI with Tailwind styling. Follow shadcn conventions.

---

### 8. Data Hooks (`/src/hooks`)

**Pattern:** Each hook exports useQuery + useMutation hooks

```typescript
// Example: useProjects.ts
export function useProjectsQuery() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("projects")
        .select()
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
```

**Hooks:**
1. `use-auth.ts` - User session, signOut
2. `use-projects.ts` - Project CRUD
3. `use-tasks.ts` - Task CRUD
4. `use-budget.ts` - Budget CRUD
5. `use-toast.ts` - Toast notifications

**All use:**
- TanStack Query for server state
- Supabase client from `@supabase/ssr`
- TypeScript generics for type safety
- Error handling with toast feedback

---

### 9. Supabase Integration (`/src/lib/supabase`)

| File | Purpose |
|------|---------|
| `client.ts` | Browser client for CSR operations |
| `server.ts` | Server client for SSR/RSC |
| `middleware.ts` | Token refresh handler |

**Key Pattern:**
- Cookie-based session (no localStorage)
- Automatic token refresh via middleware
- RLS policies enforce user isolation

---

### 10. Supporting Files

| File | Purpose |
|------|---------|
| `/src/middleware.ts` | Auth check + token refresh |
| `/src/types/database.ts` | Auto-generated DB types |
| `/src/stores/ui-store.ts` | Zustand (sidebar, modals) |
| `/src/lib/utils.ts` | Helper functions (classNameMerge) |
| `tailwind.config.ts` | Theming (colors, animations) |
| `tsconfig.json` | Path aliases (@/), strict mode |

---

## Key Architectural Patterns

### Pattern 1: Server-Side Rendering with Auth
- Next.js middleware validates auth
- SSR pages check session via getUser()
- Protected routes redirect to login
- Non-authenticated routes show public content

### Pattern 2: Data Fetching via Hooks
- Component requests data through hooks
- Hooks use TanStack Query for caching
- Automatic refetch on window focus
- Loading/error states managed in hook

### Pattern 3: Form Validation
- React Hook Form handles state
- Zod schemas for validation
- Server-side RLS provides second layer
- Optimistic updates for UX

### Pattern 4: Component Organization
- One component per file
- Related components in feature folders
- UI primitives in separate folder
- Shared across features

### Pattern 5: Type Safety
- Strict TypeScript mode
- Generated types from Supabase
- Zod runtime validation
- No `any` types in codebase

---

## Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies (Next.js 15, React 19, TQ 5) |
| `.env.local` | Supabase URL, ANON KEY |
| `next.config.ts` | Build optimization |
| `tsconfig.json` | Compiler options (strict, paths) |
| `tailwind.config.ts` | Design tokens, animations |
| `.eslintrc.json` | Linting rules |

---

## Quality Metrics (Phase 1)

- **Build Status:** ✅ Passes
- **TypeScript Errors:** 0
- **ESLint Warnings:** 0
- **Code Review Grade:** B+ (good, production-ready)
- **Test Coverage:** Planned for Phase 2

---

## Common Tasks

### Adding a New Page
1. Create file in `/src/app/(dashboard)/[feature]/page.tsx`
2. Import layout from parent
3. Use hooks for data fetching

### Adding a New Data Hook
1. Create `/src/hooks/use-[feature].ts`
2. Export useQuery + useMutations
3. Use TanStack Query patterns
4. Add error handling + typing

### Adding a New Component
1. Create feature folder in `/src/components/[feature]`
2. Follow naming: `[feature]-[type].tsx`
3. Use shadcn/ui primitives for styling
4. Prop validation with TypeScript

### Updating Database Schema
1. Create migration in Supabase dashboard
2. Run locally: `npx supabase db pull`
3. Update `/src/types/database.ts`
4. Update hooks to reflect new fields

---

## Dependencies (Notable)

| Package | Version | Usage |
|---------|---------|-------|
| next | 15.1.4 | Framework |
| react | 19.0.0 | UI library |
| @supabase/ssr | 0.5.2 | Auth + SSR |
| @tanstack/react-query | 5.62.8 | Data fetching |
| zustand | 5.0.2 | UI state |
| react-hook-form | 7.54.2 | Forms |
| zod | 3.24.1 | Validation |
| tailwindcss | 3.4.17 | Styling |

---

## Next Steps (Phase 2)

1. Add task dependencies
2. Implement notifications
3. Add advanced filtering
4. Build analytics dashboard
5. Setup testing (Vitest)
6. Improve accessibility (a11y)
