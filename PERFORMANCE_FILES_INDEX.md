# Performance-Related Files - Complete Index

## Scout Report: UI Loading Performance, Data Fetching & Caching

This index documents all files that impact application performance, particularly UI loading, data fetching, and caching strategies.

**Generated:** 2026-02-01 | **Report:** `plans/reports/scout-2026-02-01-performance-files.md`

---

## Core Performance Files (Must Review First)

### 1. React Query Configuration
- `/src/app/providers.tsx` - Global QueryClient setup (60s staleTime, no refetch on focus)

### 2. Supabase Integration
- `/src/lib/supabase/client.ts` - Browser Supabase client factory
- `/src/lib/supabase/middleware.ts` - Auth middleware with route guards
- `/src/lib/supabase/server.ts` - Server-side Supabase client

### 3. Offline-First Caching
- `/src/lib/db.ts` - Dexie IndexedDB store (3 tables: tasks, guests, projects)
- `/src/hooks/use-offline-sync.ts` - Offline sync manager with auto-sync
- `/src/hooks/use-online-status.ts` - Online/offline status detector

### 4. Next.js & PWA
- `/next.config.ts` - PWA config with Workbox runtime caching (Supabase API + images)
- `/src/app/layout.tsx` - Root layout with font optimization & PWA manifest
- `/src/app/(dashboard)/layout.tsx` - Dashboard layout with sidebar navigation

---

## Data Fetching Hooks (React Query)

### All 14 Custom Hooks Using React Query Pattern

**Query Hooks (Read Operations):**
1. `/src/hooks/use-projects.ts` - useProjects(), useProject()
2. `/src/hooks/use-tasks.ts` - useTasks(), useTask()
3. `/src/hooks/use-guests.ts` - useGuests(), useGuestGroups(), useGuestStats()
4. `/src/hooks/use-members.ts` - useProjectMembers(), useMyInvites()
5. `/src/hooks/use-comments.ts` - useComments() + Supabase real-time subscription
6. `/src/hooks/use-activity.ts` - useActivityLogs()
7. `/src/hooks/use-attachments.ts` - useAttachments()
8. `/src/hooks/use-budget.ts` - useBudgetCategories()
9. `/src/hooks/use-sync-logs.ts` - useSyncLogs()

**Mutation Hooks (Write Operations):**
- useCreateTask, useUpdateTask, useDeleteTask, useUpdateTaskStatus (optimistic)
- useCreateProject, useUpdateProject, useDeleteProject
- useCreateGuest, useUpdateGuest, useDeleteGuest, useBulkUpdateRsvp
- useInviteMember, useAcceptInvite, useRejectInvite, useUpdateMemberRole, useRemoveMember
- useAddComment, useUpdateComment, useDeleteComment
- useUploadAttachment, useDeleteAttachment, useDownloadAttachment
- useCreateBudgetCategory, useUpdateBudgetCategory, useDeleteBudgetCategory
- useSyncFromSheet

### Special Hooks (Manual State)
- `/src/hooks/use-auth.ts` - Auth state with real-time subscription (NOT React Query)
- `/src/hooks/use-toast.ts` - Toast notifications
- `/src/hooks/use-templates.ts` - Template management

---

## State Management & UI

### Zustand Store
- `/src/stores/ui-store.ts` - UI state (sidebarOpen) with localStorage persistence

### Layout Components
- `/src/components/shared/sidebar.tsx` - Fixed sidebar with toggle animation
- `/src/components/shared/header.tsx` - Fixed header with user menu & offline indicator
- `/src/components/shared/loading.tsx` - Loading spinners (50vh & fullscreen)

---

## Page Routes (Code Splitting Points)

### Authentication Routes
- `/src/app/(auth)/login/page.tsx`
- `/src/app/(auth)/signup/page.tsx`

### Dashboard Routes
- `/src/app/(dashboard)/page.tsx` - Main dashboard
- `/src/app/(dashboard)/projects/page.tsx` - Projects list
- `/src/app/(dashboard)/projects/new/page.tsx` - Create project

### Project Detail Routes (Dynamic [id] Segments)
- `/src/app/(dashboard)/projects/[id]/page.tsx` - Project overview
- `/src/app/(dashboard)/projects/[id]/tasks/page.tsx` - Task management
- `/src/app/(dashboard)/projects/[id]/guests/page.tsx` - Guest list
- `/src/app/(dashboard)/projects/[id]/members/page.tsx` - Team members
- `/src/app/(dashboard)/projects/[id]/budget/page.tsx` - Budget tracking
- `/src/app/(dashboard)/projects/[id]/calendar/page.tsx` - Calendar view
- `/src/app/(dashboard)/projects/[id]/activity/page.tsx` - Activity log
- `/src/app/(dashboard)/projects/[id]/analytics/page.tsx` - Analytics dashboard
- `/src/app/(dashboard)/projects/[id]/checkin/page.tsx` - Check-in/QR codes
- `/src/app/(dashboard)/projects/[id]/export/page.tsx` - Export data
- `/src/app/(dashboard)/projects/[id]/guests/sync/page.tsx` - Guest sync

---

## API Routes

- `/src/app/api/sheets/sync/route.ts` - Google Sheets sync endpoint

---

## Component Libraries & Feature Components

### UI Components (Shadcn/UI)
- `/src/components/ui/` - 60+ base components (button, input, card, dialog, table, skeleton, etc.)

### Feature Components
- `/src/components/tasks/` - Task CRUD, kanban board, detail dialog
- `/src/components/projects/` - Project list, card, form
- `/src/components/guests/` - Guest table, sync dialog, filters, stats
- `/src/components/comments/` - Comment list, form, item
- `/src/components/budget/` - Budget summary, pie/bar charts
- `/src/components/attachments/` - Upload button, file list, preview
- `/src/components/analytics/` - Progress cards, budget charts
- `/src/components/pwa/` - Offline indicator, install prompt
- `/src/components/auth/` - Login form, signup form
- `/src/components/members/` - Invite form, members list
- `/src/components/checkin/` - Check-in stats, QR display

---

## Utilities & Helpers

- `/src/lib/utils.ts` - General utilities
- `/src/lib/google-sheets.ts` - Google Sheets API integration
- `/src/lib/qr.ts` - QR code generation
- `/src/lib/pdf/project-report.tsx` - PDF export
- `/src/lib/pdf/guest-list-report.tsx` - PDF export
- `/src/lib/pdf/index.ts` - PDF utilities

---

## Key Performance Patterns

### Implemented ✓
- Memoized Supabase client in every hook
- React Query caching with 60s staleTime
- Disabled refetchOnWindowFocus
- Enabled guards (skip queries when IDs missing)
- Optimistic updates (useUpdateTaskStatus)
- Dual-fetch pattern (separate queries for items + related data)
- IndexedDB offline caching (Dexie)
- PWA runtime caching (Workbox)
- Lazy real-time subscriptions (useComments)
- Query invalidation on mutations
- Dependent query optimization (useGuestStats)

### Not Yet Implemented ✗
- React Server Components / Suspense boundaries
- Pagination (most queries fetch all records)
- Image optimization (Next.js Image component)
- Per-route code splitting
- Error boundaries
- Request deduplication
- Auth hook migration to React Query

---

## Query Keys Reference

```
["tasks", projectId]
["tasks", "detail", taskId]
["projects"]
["projects", projectId]
["guests", projectId]
["guest_groups", projectId]
["project_members", projectId]
["my_invites"]
["comments", taskId]
["activity_logs", projectId, entityType?]
["attachments", taskId]
["budget_categories", projectId]
["sync_logs", projectId]
```

---

## Critical Files for Performance Optimization

### Highest Impact (Must Review)
1. `/src/app/providers.tsx` - Adjust staleTime, caching strategy
2. `/src/hooks/use-guests.ts` - Pagination for large guest lists
3. `/src/hooks/use-activity.ts` - Pagination for large activity logs
4. `/src/hooks/use-members.ts` - Dual-fetch optimization
5. `/next.config.ts` - PWA caching strategies

### High Impact (Should Review)
6. `/src/lib/db.ts` - IndexedDB schema optimization
7. `/src/hooks/use-comments.ts` - Real-time subscription management
8. `/src/app/(dashboard)/layout.tsx` - Layout boundary optimization
9. `/src/components/shared/sidebar.tsx` - Navigation performance
10. `/src/stores/ui-store.ts` - State management efficiency

### Medium Impact (Consider)
11. All data fetching hooks - Consistency check
12. `/src/lib/supabase/middleware.ts` - Auth check performance
13. Component libraries - Unused code elimination

---

## Performance Testing Recommendations

1. **Measure Current State:**
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)
   - Time to Interactive (TTI)

2. **Profile Query Performance:**
   - React Query DevTools
   - Network tab (slow connections)
   - IndexedDB size/overflow

3. **Test Offline Mode:**
   - Device offline simulation
   - Sync queue behavior
   - Storage limits

4. **Validate Caching:**
   - PWA cache hit rates
   - Supabase API cache efficiency
   - Duplicate request elimination

---

## Related Documentation

- **Reports:** `/plans/reports/scout-2026-02-01-performance-files.md`
- **Quick Ref:** `/plans/reports/scout-quick-reference.md`
- **React Query:** https://tanstack.com/query/latest
- **Supabase:** https://supabase.com/docs
- **Dexie:** https://dexie.org/
- **Next.js PWA:** https://ducanh2912.github.io/next-pwa/
- **Zustand:** https://github.com/pmndrs/zustand

---

## File Count Summary

- **Total Hooks:** 14 (12 React Query + 2 manual state)
- **Data Fetching Hooks:** 9 (with 35+ mutation functions)
- **Page Routes:** 16
- **Layout Files:** 2
- **Component Directories:** 11
- **UI Components:** 60+
- **API Routes:** 1
- **Configuration Files:** 1 (next.config.ts)
- **Store Files:** 1
- **Utility Files:** 4

---

**Last Updated:** 2026-02-01
**Scout Status:** Complete
