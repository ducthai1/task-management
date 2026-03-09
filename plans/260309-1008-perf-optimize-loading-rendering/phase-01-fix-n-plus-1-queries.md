# Phase 01: Fix N+1 Queries with Supabase JOINs

**Parent:** [plan.md](./plan.md)
**Dependencies:** FK constraints must exist (see `supabase/FIX-FOREIGN-KEYS.sql`)
**Docs:** [codebase-summary](../../docs/codebase-summary.md)

## Overview
- **Date:** 2026-03-09
- **Description:** Replace 2-sequential-request pattern with single Supabase JOIN query
- **Priority:** HIGH
- **Implementation Status:** `pending`
- **Review Status:** `pending`

## Key Insights
- 3 hooks fetch main data then separately fetch profiles — doubles API calls
- `FIX-FOREIGN-KEYS.sql` already defines FKs: `comments_user_id_profiles_fkey`, `activity_logs_user_id_profiles_fkey`
- `project_members.user_id` references `auth.users` (not profiles directly), but profiles.id = auth.users.id, so FK path exists
- Supabase PostgREST supports embedded resources via FK: `.select("*, user:profiles(id, full_name, avatar_url)")`

## Requirements
1. Replace N+1 queries with single JOIN in use-comments.ts, use-members.ts, use-activity.ts
2. Maintain same return shape (Comment/ActivityLog with `user?: Profile`)
3. Remove intermediate types (CommentRow, ActivityLogRow, ProjectMemberRow) if no longer needed
4. Keep realtime subscription in use-comments.ts working

## Architecture
**Before (2 requests):**
```
queryFn: fetch comments → fetch profiles by IDs → merge manually
```
**After (1 request):**
```
queryFn: supabase.from("comments").select("*, user:profiles!comments_user_id_profiles_fkey(id, full_name, avatar_url)")
```

## Related Code Files
| File | Lines | Change |
|------|-------|--------|
| `src/hooks/use-comments.ts` | 24-49 | Replace 2-query with JOIN |
| `src/hooks/use-members.ts` | 28-61 | Replace 2-query with JOIN |
| `src/hooks/use-activity.ts` | 25-55 | Replace 2-query with JOIN |
| `src/types/database.ts` | 424-456 | Verify Comment/ActivityLog types compatible |

## Implementation Steps

### Step 1: Fix `use-comments.ts` — useComments queryFn
**Current (lines 24-49):** Fetches comments, extracts userIds, fetches profiles, manually merges.
**New:**
```typescript
const { data, error } = await supabase
  .from("comments")
  .select("id, task_id, user_id, content, created_at, updated_at, user:profiles!comments_user_id_profiles_fkey(id, full_name, avatar_url)")
  .eq("task_id", taskId)
  .order("created_at", { ascending: true });
```
- Remove `CommentRow` interface (lines 9-16)
- Return data directly as `Comment[]` (shape already matches: `user?: Profile`)
- Remove `userIds` extraction and second query

### Step 2: Fix `use-comments.ts` — useAddComment mutationFn
**Current (lines 88-112):** After inserting comment, separately fetches user profile.
**New:** After insert with `.select("id, task_id, user_id, content, created_at, updated_at, user:profiles!comments_user_id_profiles_fkey(id, full_name, avatar_url)")`, return directly.

### Step 3: Fix `use-members.ts` — useProjectMembers queryFn
**Current (lines 28-61):** Fetches members, extracts userIds, fetches profiles, merges.
**New:**
```typescript
const { data, error } = await supabase
  .from("project_members")
  .select("*, profile:profiles!user_id(id, full_name, avatar_url)")
  .eq("project_id", projectId)
  .order("created_at", { ascending: true });
```
- Note: `project_members.user_id` → need to check FK. If no direct FK to profiles, use hint syntax.
- Remove `ProjectMemberRow` interface (lines 13-21)
- Return shape: `MemberWithProfile` already expects `{ ...member, profile?: Profile }`

### Step 4: Fix `use-activity.ts` — useActivityLogs queryFn
**Current (lines 25-55):** Fetches logs, extracts userIds, fetches profiles, merges.
**New:**
```typescript
const { data, error } = await supabase
  .from("activity_logs")
  .select("*, user:profiles!activity_logs_user_id_profiles_fkey(id, full_name, avatar_url)")
  .eq("project_id", projectId)
  .order("created_at", { ascending: false })
  .limit(100);
```
- Remove `ActivityLogRow` interface (lines 8-18)

## Todo
- [ ] Verify FKs are applied in production Supabase DB
- [ ] Update use-comments.ts queryFn to use JOIN
- [ ] Update use-comments.ts useAddComment to use JOIN
- [ ] Update use-members.ts queryFn to use JOIN
- [ ] Update use-activity.ts queryFn to use JOIN
- [ ] Remove unused intermediate types
- [ ] Test: comments load with user profile in single request
- [ ] Test: members load with profile in single request
- [ ] Test: activity logs load with user in single request
- [ ] Test: realtime comment subscription still works

## Success Criteria
- Each hook makes 1 API call instead of 2
- Same UI rendering (user names, avatars displayed correctly)
- No TypeScript errors
- Realtime comments still update

## Risk Assessment
- **LOW:** FK might not exist in prod → run FIX-FOREIGN-KEYS.sql first
- **LOW:** PostgREST hint syntax might differ → test with exact FK name
- **NONE:** No schema changes required

## Security Considerations
- RLS policies unchanged — still enforced at DB level
- No new data exposure (same fields selected)

## Next Steps
After completion, proceed to Phase 02: Eliminate Duplicate Fetches
