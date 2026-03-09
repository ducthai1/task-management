# Quick Reference: Performance Files Index

## Quick Access by Category

### React Query & Data Fetching
```
/Users/admin/Downloads/AI/task-management/src/app/providers.tsx              → QueryClient config (60s staleTime)
/Users/admin/Downloads/AI/task-management/src/hooks/use-tasks.ts             → Task queries + optimistic updates
/Users/admin/Downloads/AI/task-management/src/hooks/use-projects.ts          → Project queries
/Users/admin/Downloads/AI/task-management/src/hooks/use-guests.ts            → Guest queries + stats
/Users/admin/Downloads/AI/task-management/src/hooks/use-members.ts           → Member queries (dual-fetch pattern)
/Users/admin/Downloads/AI/task-management/src/hooks/use-comments.ts          → Comment queries + real-time subscription
/Users/admin/Downloads/AI/task-management/src/hooks/use-activity.ts          → Activity log queries
/Users/admin/Downloads/AI/task-management/src/hooks/use-attachments.ts       → File attachment queries
/Users/admin/Downloads/AI/task-management/src/hooks/use-budget.ts            → Budget category queries
```

### Offline & Caching
```
/Users/admin/Downloads/AI/task-management/src/lib/db.ts                      → Dexie IndexedDB store (3 tables)
/Users/admin/Downloads/AI/task-management/src/hooks/use-offline-sync.ts      → Offline sync manager
/Users/admin/Downloads/AI/task-management/src/hooks/use-online-status.ts     → Online/offline detector
/Users/admin/Downloads/AI/task-management/next.config.ts                     → PWA caching strategies
```

### Supabase Integration
```
/Users/admin/Downloads/AI/task-management/src/lib/supabase/client.ts         → Browser client factory
/Users/admin/Downloads/AI/task-management/src/lib/supabase/server.ts         → Server client
/Users/admin/Downloads/AI/task-management/src/lib/supabase/middleware.ts      → Auth middleware + route guards
```

### State Management & UI
```
/Users/admin/Downloads/AI/task-management/src/stores/ui-store.ts             → Zustand UI store (sidebar toggle)
/Users/admin/Downloads/AI/task-management/src/hooks/use-auth.ts              → Auth state + subscriptions
```

### Layouts & Boundaries
```
/Users/admin/Downloads/AI/task-management/src/app/layout.tsx                 → Root layout
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/layout.tsx      → Dashboard layout
/Users/admin/Downloads/AI/task-management/src/components/shared/loading.tsx   → Loading fallback components
/Users/admin/Downloads/AI/task-management/src/components/shared/header.tsx    → Fixed header (z-30)
/Users/admin/Downloads/AI/task-management/src/components/shared/sidebar.tsx   → Fixed sidebar (z-40)
```

### Pages (Code Splitting Points)
```
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/page.tsx        → Dashboard home
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/page.tsx → Projects list
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/tasks/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/guests/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/members/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/budget/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/calendar/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/activity/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/analytics/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/checkin/page.tsx
/Users/admin/Downloads/AI/task-management/src/app/(dashboard)/projects/[id]/export/page.tsx
```

## Key Query Patterns

### Basic Query Pattern (12 hooks)
```typescript
const supabase = useMemo(() => createClient(), []);
return useQuery({
  queryKey: ["resource", id],
  queryFn: async () => { /* fetch */ },
  enabled: !!id,  // Prevent unnecessary requests
});
```

### Dual-Fetch Pattern (useMembers, useComments, useActivity)
1. Fetch main resource (e.g., members)
2. Extract IDs (e.g., user_id)
3. Fetch related data (e.g., profiles)
4. Merge using Map for O(1) lookup

### Real-Time Subscriptions (useComments)
- Supabase channel subscription in useEffect
- Invalidates query on postgres_changes
- Cleanup: removeChannel on unmount

### Optimistic Updates (useUpdateTaskStatus)
1. Cancel ongoing queries with queryClient.cancelQueries
2. Get previous data with getQueryData
3. Set optimistic data with setQueryData
4. Rollback on error
5. Invalidate on success

## Query Keys Convention
```
["tasks", projectId]
["tasks", "detail", id]
["projects"]
["projects", id]
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

## Performance Checklist

- [x] Memoized Supabase client
- [x] Query caching (60s staleTime)
- [x] Disabled refetchOnWindowFocus
- [x] Enabled guards (skip unnecessary queries)
- [x] Optimistic updates for mutations
- [x] Offline-first IndexedDB caching
- [x] PWA runtime caching
- [x] Lazy real-time subscriptions
- [ ] React Server Components / Suspense boundaries
- [ ] Pagination for large lists
- [ ] Image optimization (Next.js Image)
- [ ] Code splitting per route
- [ ] Error boundaries
- [ ] Request deduplication

## File Sizes (Approximate)
- providers.tsx: ~300 bytes
- use-tasks.ts: ~3.5 KB
- use-projects.ts: ~3 KB
- use-members.ts: ~9 KB
- use-comments.ts: ~5.5 KB
- use-guests.ts: ~6.5 KB
- use-activity.ts: ~3 KB
- db.ts: ~3.5 KB
- ui-store.ts: ~0.6 KB
- middleware.ts: ~2 KB
- next.config.ts: ~1 KB

## Related Documentation
- React Query: https://tanstack.com/query/latest
- Supabase: https://supabase.com/docs
- Dexie: https://dexie.org/
- Next.js PWA: https://ducanh2912.github.io/next-pwa/
- Zustand: https://github.com/pmndrs/zustand
