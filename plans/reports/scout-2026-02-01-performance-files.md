# Performance-Related Files Scout Report
**Date:** 2026-02-01 | **Focus:** UI Loading Performance, Data Fetching, Caching, React Query Configuration

---

## Summary
Complete inventory of performance-impacting files across the task management application. These files are critical for optimizing UI loading, data fetching, caching strategies, and overall application performance.

---

## 1. React Query & Provider Configuration

### Core Query Setup
- `/Users/admin/Downloads/AI/task-management/src/app/providers.tsx`
  - **Purpose:** Main provider component with React Query configuration
  - **Key Details:** QueryClient with 60s staleTime, refetchOnWindowFocus disabled
  - **Performance Impact:** Sets global caching behavior for all queries

### Layout Files (Suspense & Loading Boundaries)
- `/Users/admin/Downloads/AI/task-management/src/app/layout.tsx`
  - Root layout with metadata, viewport optimization, PWA manifest
  - Font optimization (Inter with Vietnamese subsets)

- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/layout.tsx`
  - Dashboard layout with sidebar and header management
  - Uses Zustand store for UI state (sidebar toggle)
  - CSS transitions with fixed positioning

---

## 2. Data Fetching Hooks (useQuery, useMutation)

All hooks use React Query's `useQuery` and `useMutation` with Supabase client. **Key Pattern:** `useMemo(() => createClient(), [])` for client memoization.

### Primary Data Hooks
- `/Users/admin/Downloads/AI/task-management/src/hooks/use-tasks.ts`
  - `useTasks()` - fetch all tasks by project
  - `useTask()` - fetch single task detail
  - `useCreateTask()`, `useUpdateTask()`, `useDeleteTask()`
  - `useUpdateTaskStatus()` - with optimistic updates
  - **Caching:** Query key: ["tasks", projectId], enabled check: !!projectId

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-projects.ts`
  - `useProjects()` - fetch all projects
  - `useProject()` - fetch single project
  - `useCreateProject()`, `useUpdateProject()`, `useDeleteProject()`
  - **Caching:** Query key: ["projects", id]

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-guests.ts`
  - `useGuests()` - fetch project guests
  - `useGuestGroups()` - distinct guest group names
  - `useGuestStats()` - computed guest statistics using dependent query
  - `useCreateGuest()`, `useUpdateGuest()`, `useDeleteGuest()`
  - `useBulkUpdateRsvp()` - batch RSVP updates
  - **Performance Note:** useGuestStats() derives from useGuests() data

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-members.ts`
  - `useProjectMembers()` - dual-query pattern (members + profiles separately)
  - `useMyInvites()` - pending invitations for current user
  - `useInviteMember()`, `useAcceptInvite()`, `useRejectInvite()`
  - `useUpdateMemberRole()`, `useRemoveMember()`
  - **Performance Note:** Fetches users and profiles separately, uses Map for join

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-comments.ts`
  - `useComments()` - comments with dual-fetch (comments + profile data)
  - `useAddComment()`, `useUpdateComment()`, `useDeleteComment()`
  - **Real-time:** Supabase channel subscription for postgres_changes
  - **Query keys:** ["comments", taskId]

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-activity.ts`
  - `useActivityLogs()` - fetch activity logs with user profiles
  - `logActivityClient()` - client-side activity logger
  - **Pagination:** Limits to 100 records
  - **Dual-fetch pattern:** Logs + profiles separately

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-attachments.ts`
  - `useAttachments()` - fetch task attachments
  - `useUploadAttachment()` - file upload (max 10MB) with storage + DB record
  - `useDeleteAttachment()` - storage + DB cleanup
  - `useDownloadAttachment()` - blob download with ObjectURL

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-budget.ts`
  - `useBudgetCategories()` - fetch budget categories
  - `useCreateBudgetCategory()`, `useUpdateBudgetCategory()`, `useDeleteBudgetCategory()`
  - **Query keys:** ["budget_categories", projectId]

### Specialized Hooks
- `/Users/admin/Downloads/AI/task-management/src/hooks/use-sync-logs.ts`
  - `useSyncLogs()` - sync log history (limited to 20 records)
  - `useSyncFromSheet()` - Google Sheets sync mutation with API endpoint

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-auth.ts`
  - Manual auth state management (not using React Query)
  - **Pattern:** useState + useEffect with mounted check
  - `useCallback` for signOut
  - **Subscription:** Real-time auth state changes via `onAuthStateChange`

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-online-status.ts`
  - Tracks navigator.onLine status
  - Event listeners for "online" and "offline"
  - **Used by:** useOfflineSync hook

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-offline-sync.ts`
  - Manages offline-first sync queue
  - Detects pending items from IndexedDB
  - Auto-syncs when online
  - **State:** pendingCount, isSyncing, lastSyncTime
  - **Performance Note:** useCallback memoization for sync functions

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-toast.ts`
  - Toast notification hook (likely shadcn/ui toast)

- `/Users/admin/Downloads/AI/task-management/src/hooks/use-templates.ts`
  - Template management hook

---

## 3. Supabase Configuration & Client Management

- `/Users/admin/Downloads/AI/task-management/src/lib/supabase/client.ts`
  - Browser Supabase client factory
  - **Type:** `createBrowserClient<Database>`
  - Uses env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

- `/Users/admin/Downloads/AI/task-management/src/lib/supabase/server.ts`
  - Server-side Supabase client (likely middleware support)

- `/Users/admin/Downloads/AI/task-management/src/lib/supabase/middleware.ts`
  - Supabase SSR middleware
  - **Flow:** Auth check → protected/public route logic
  - Handles cookie management for session persistence
  - **Performance:** Early auth check, guards protected routes

---

## 4. Offline-First & Caching Strategy

- `/Users/admin/Downloads/AI/task-management/src/lib/db.ts`
  - **Library:** Dexie (IndexedDB wrapper)
  - **Tables:** tasks, guests, projects
  - **Indexes:** "id, project_id, syncPending, lastModified" (tasks/guests)
  - **Caching Functions:**
    - `cacheProjects()`, `cacheTasks()`, `cacheGuests()`
    - `getOfflineProjects()`, `getOfflineTasks()`, `getOfflineGuests()`
    - `getPendingSyncItems()` - fetch sync queue
    - `markTaskSynced()`, `markGuestSynced()`
  - **Performance Impact:** Local-first reads, network as fallback

---

## 5. Loading & Fallback Components

- `/Users/admin/Downloads/AI/task-management/src/components/shared/loading.tsx`
  - `Loading()` - 50vh centered spinner
  - `LoadingPage()` - full-screen loader
  - **Icon:** lucide-react Loader2 with animation

---

## 6. Layout & Navigation (Affects Render Performance)

- `/Users/admin/Downloads/AI/task-management/src/components/shared/header.tsx`
  - Fixed header (z-30) with responsive width (sidebar-aware)
  - Uses `useAuth()` and `useUIStore()`
  - Avatar, dropdown menu, offline indicator
  - CSS transitions: "transition-all duration-300"

- `/Users/admin/Downloads/AI/task-management/src/components/shared/sidebar.tsx`
  - Fixed sidebar (z-40) with toggle animation
  - Uses Zustand `useUIStore()` for sidebar state
  - Responsive width: 64px (closed) / 256px (open)
  - CSS transitions: "transition-all duration-300"

---

## 7. UI State Management

- `/Users/admin/Downloads/AI/task-management/src/stores/ui-store.ts`
  - **Library:** Zustand with persist middleware
  - **State:** sidebarOpen (boolean)
  - **Storage:** localStorage via "ui-storage" key
  - **Methods:** toggleSidebar(), setSidebarOpen()
  - **Performance:** Persistent UI state reduces layout shifts

---

## 8. Page Routes (Potential Code Splitting Points)

- `/Users/admin/Downloads/AI/task-management/src/app/(auth)/login/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(auth)/signup/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/new/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/tasks/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/members/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/guests/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/budget/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/calendar/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/activity/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/analytics/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/checkin/page.tsx`
- `/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/export/page.tsx`

---

## 9. Next.js & PWA Configuration

- `/Users/admin/Downloads/AI/task-management/next.config.ts`
  - **PWA:** @ducanh2912/next-pwa enabled
  - **Runtime Caching Strategies:**
    - Supabase API: NetworkFirst (cache 300s, 100 entries max)
    - Images: CacheFirst (cache 30 days, 50 entries max)
  - **Image Optimization:** Supabase domain remote pattern
  - **PWA Features:** Aggressive frontend caching, reload on online

---

## 10. API Routes

- `/Users/admin/Downloads/AI/task-management/src/app/api/sheets/sync/route.ts`
  - Google Sheets sync endpoint (used by useSyncFromSheet mutation)

---

## 11. Component Library (UI Components - Likely Using Shadcn)

- `/Users/admin/Downloads/AI/task-management/src/components/ui/` (60+ files)
  - button.tsx, input.tsx, card.tsx, dialog.tsx, table.tsx, etc.
  - skeleton.tsx - loading placeholder
  - Progress tracking components
  - Dropdown menus, tabs, avatars

### Feature Components
- `/Users/admin/Downloads/AI/task-management/src/components/tasks/` - task CRUD, kanban, detail dialog
- `/Users/admin/Downloads/AI/task-management/src/components/projects/` - project list, card, form
- `/Users/admin/Downloads/AI/task-management/src/components/guests/` - guest table, sync, filters, stats
- `/Users/admin/Downloads/AI/task-management/src/components/comments/` - comment list, form, item
- `/Users/admin/Downloads/AI/task-management/src/components/budget/` - budget summary, charts
- `/Users/admin/Downloads/AI/task-management/src/components/attachments/` - upload, list, preview
- `/Users/admin/Downloads/AI/task-management/src/components/analytics/` - charts, progress cards
- `/Users/admin/Downloads/AI/task-management/src/components/pwa/` - offline indicator, install prompt
- `/Users/admin/Downloads/AI/task-management/src/components/auth/` - login, signup forms
- `/Users/admin/Downloads/AI/task-management/src/components/members/` - invite, list, roles
- `/Users/admin/Downloads/AI/task-management/src/components/checkin/` - checkin, QR display, stats

---

## 12. Utilities & Helpers

- `/Users/admin/Downloads/AI/task-management/src/lib/utils.ts`
- `/Users/admin/Downloads/AI/task-management/src/lib/google-sheets.ts` - Google Sheets API integration
- `/Users/admin/Downloads/AI/task-management/src/lib/qr.ts` - QR code generation
- `/Users/admin/Downloads/AI/task-management/src/lib/pdf/` - PDF generation (project/guest reports)

---

## Key Performance Patterns Identified

### Optimizations Present
1. **Memoized Supabase Client:** All hooks use `useMemo(() => createClient(), [])`
2. **React Query Configuration:** 60s staleTime, disabled refetchOnWindowFocus
3. **Enabled Guards:** All queries use `enabled: !!projectId` to prevent unnecessary requests
4. **Optimistic Updates:** useUpdateTaskStatus uses onMutate for immediate UI feedback
5. **Dual-Query Pattern:** useMembers, useComments, useActivity fetch items + profiles separately for efficiency
6. **Offline-First:** IndexedDB caching with sync queue (Dexie-based)
7. **PWA Caching:** Workbox runtime caching for API and images
8. **Dependent Queries:** useGuestStats derives from useGuests to avoid redundant fetches
9. **Query Invalidation:** Proper cache invalidation on mutations
10. **Lazy Subscriptions:** Real-time subscriptions only when needed (useComments)

### Areas for Potential Optimization
1. **No Suspense/Streaming:** No React Server Components or Suspense boundaries detected
2. **No Pagination:** Many queries fetch unlimited records (activity logs limited to 100)
3. **Manual Auth Hook:** useAuth not using React Query pattern
4. **Bulk Operations:** Limited batch query support
5. **No Compression:** No mention of query compression or optimistic rollback patterns
6. **CSS-in-JS:** Tailwind classes (check for className bloat)
7. **Modal States:** No error boundary components visible

---

## File Statistics
- **Total Hooks:** 14 custom hooks
- **Query-based Hooks:** 12 (useQuery/useMutation patterns)
- **Manual State Hooks:** 1 (useAuth)
- **Online Status Hook:** 1
- **Supabase Clients:** 3 (browser, server, middleware)
- **Stores:** 1 (UI store with persistence)
- **Pages:** 16 route pages
- **Layout Files:** 2 (root + dashboard)
- **Loading Components:** 1 shared loader
- **Navigation Components:** 2 (header, sidebar)
- **API Routes:** 1 (sheets sync)
- **Database:** 1 Dexie store with 3 tables
- **PWA Config:** 1 (next.config.ts)

---

## Unresolved Questions
1. Are there React Server Components (RSC) being used for initial data loading?
2. What's the current Largest Contentful Paint (LCP) time?
3. Are there any bottleneck queries (e.g., guest list with 1000+ records)?
4. Is image optimization using Next.js Image component?
5. Are there code-splitting opportunities at the route level?
6. Is there request deduplication for concurrent queries?
7. What's the IndexedDB storage limit and overflow strategy?
8. Are there API rate limits from Supabase?
