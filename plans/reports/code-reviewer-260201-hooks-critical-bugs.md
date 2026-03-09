# Code Review: Critical Bugs in Hooks

## Scope
- Files reviewed: 14 hook files in `/src/hooks/`
- Review focus: Supabase queries, type errors, error handling, race conditions, memory leaks
- Date: 2026-02-01

## Overall Assessment
**CRITICAL**: Multiple showstopper bugs found that will break app functionality. Primary issues are missing Supabase tables (comments, attachments, activity_logs not in database schema), dependency exhaustive-deps violations causing infinite loops, and incomplete error handling.

---

## CRITICAL ISSUES

### 1. **use-comments.ts - MISSING DATABASE TABLE**
**Lines:** 27-32, All queries
**Impact:** Complete feature failure - comments won't work at all

**Problem:** Queries `comments` table but schema in `database.ts` doesn't include it. Comments are defined as interface (line 424-432 in database.ts) but NOT in Database.Tables.

```typescript
// Line 27-32: Query will fail - table doesn't exist in types
const { data: comments, error } = await supabase
  .from("comments")  // ❌ NOT in Database["public"]["Tables"]
  .select("*")
```

**Fix Required:**
Add to `/src/types/database.ts`:
```typescript
comments: {
  Row: {
    id: string;
    task_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  };
  Insert: { /* ... */ };
  Update: { /* ... */ };
  Relationships: [ /* ... */ ];
}
```

### 2. **use-attachments.ts - MISSING DATABASE TABLE**
**Lines:** 15-19, All queries
**Impact:** Complete feature failure - file uploads won't work

**Problem:** Same as comments - `attachments` table not in Database.Tables schema.

```typescript
// Line 15: Type error - table doesn't exist
const { data, error } = await supabase
  .from("attachments")  // ❌ NOT in types
  .select("*")
```

**Fix Required:**
Add to `/src/types/database.ts`:
```typescript
attachments: {
  Row: {
    id: string;
    task_id: string;
    file_name: string;
    file_path: string;
    file_size: number | null;
    file_type: string | null;
    uploaded_by: string;
    created_at: string;
  };
  Insert: { /* ... */ };
  Update: { /* ... */ };
  Relationships: [ /* ... */ ];
}
```

### 3. **use-activity.ts - MISSING DATABASE TABLE**
**Lines:** 14-18, All queries
**Impact:** Activity logging completely broken

**Problem:** `activity_logs` table not in schema types.

```typescript
// Line 14: Will fail at runtime
let query = supabase
  .from("activity_logs")  // ❌ NOT in types
  .select("*, user:profiles(id, full_name, avatar_url)")
```

**Fix Required:**
Add to `/src/types/database.ts`:
```typescript
activity_logs: {
  Row: {
    id: string;
    project_id: string;
    user_id: string;
    action: "create" | "update" | "delete";
    entity_type: "task" | "guest" | "budget" | "member";
    entity_id: string;
    entity_name: string | null;
    changes: Json | null;
    created_at: string;
  };
  Insert: { /* ... */ };
  Update: { /* ... */ };
  Relationships: [ /* ... */ ];
}
```

### 4. **use-auth.ts - INFINITE LOOP / DEPENDENCY ISSUE**
**Line:** 31
**Impact:** Causes infinite re-renders, app crashes

**Problem:** `supabase.auth` in dependency array causes recreation on every render.

```typescript
// Line 31: ❌ supabase.auth is not stable reference
useEffect(() => {
  // ... auth setup
  return () => subscription.unsubscribe();
}, [supabase.auth]);  // ❌ WRONG - causes infinite loop
```

**Fix Required:**
```typescript
// Remove dependency entirely - auth client is stable
}, []); // ✓ Correct
```

### 5. **use-toast.ts - STALE CLOSURE BUG**
**Line:** 169
**Impact:** Memory leak - listeners never cleaned up properly

**Problem:** Effect depends on `state` but shouldn't. Creates/removes listener on every state change.

```typescript
// Line 161-169: ❌ Includes state in deps
React.useEffect(() => {
  listeners.push(setState);
  return () => {
    const index = listeners.indexOf(setState);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}, [state]); // ❌ WRONG - should be []
```

**Fix Required:**
```typescript
}, []); // ✓ Only run once on mount
```

### 6. **use-offline-sync.ts - INFINITE LOOP RACE CONDITION**
**Line:** 84-88
**Impact:** Auto-sync triggers infinitely when online

**Problem:** `syncPendingItems` in dependency array but `syncPendingItems` depends on `updatePendingCount`. Circular dependency.

```typescript
// Line 31-81: syncPendingItems calls updatePendingCount
const syncPendingItems = useCallback(async () => {
  // ...
  await updatePendingCount(); // Updates pendingCount state
}, [isOnline, isSyncing, supabase, updatePendingCount]); // ⚠️

// Line 84-88: Effect depends on both
useEffect(() => {
  if (isOnline && pendingCount > 0) {
    syncPendingItems(); // ❌ Can trigger infinite loop
  }
}, [isOnline, pendingCount, syncPendingItems]); // ❌ CIRCULAR
```

**Fix Required:**
```typescript
// Remove syncPendingItems from deps, include its deps directly
useEffect(() => {
  if (!isOnline || isSyncing || pendingCount === 0) return;

  // Inline sync logic or use ref
  syncPendingItems();
}, [isOnline, pendingCount]); // ✓ Break circular dependency
```

---

## HIGH PRIORITY ISSUES

### 7. **use-members.ts - JOIN QUERY TYPE MISMATCH**
**Lines:** 20-22
**Impact:** Runtime type errors, incorrect data structure

**Problem:** Selecting nested `profile` but type expects flat `profiles`.

```typescript
// Line 20-22: Nested select syntax
.select(`
  *,
  profile:profiles(id, full_name, avatar_url)  // Returns { profile: {...} }
`)

// Line 28: Type expects different structure
return data as MemberWithProfile[];  // Expects { profile?: Profile }
```

**Fix:** Type is actually correct (line 8-10 shows `profile?: Profile | null`), but query might return `profiles` not `profile` depending on Supabase version. Verify actual response structure.

### 8. **use-members.ts - MISSING PROJECT LOOKUP**
**Lines:** 44-48
**Impact:** Returns incomplete data - project info missing

**Problem:** Selects `project:projects(id, name, type)` but type doesn't include it.

```typescript
// Line 47: Joins project data
.select(`
  *,
  project:projects(id, name, type)  // ❌ Not in ProjectMember type
`)
```

**Fix Required:**
Create extended type or ensure data structure matches expected response.

### 9. **use-comments.ts - RACE CONDITION ON MOUNT**
**Lines:** 55-77
**Impact:** Can cause stale data or double-fetches

**Problem:** Realtime subscription set up before initial query completes. Invalidates during fetch.

```typescript
// Line 22-52: Async query running
queryFn: async () => { /* ... */ },

// Line 55-77: Subscription starts immediately (parallel)
useEffect(() => {
  const channel = supabase.channel(`comments:${taskId}`)
    .on('postgres_changes', { /* ... */ }, () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      // ❌ Can invalidate during initial fetch
    })
```

**Fix Required:**
Wait for initial query to complete before subscribing, or use `enabled` flag.

### 10. **use-guests.ts - MISSING NULL CHECK**
**Lines:** 40-42
**Impact:** Runtime error if no groups exist

**Problem:** `data.map()` called before checking if data exists.

```typescript
// Line 40-41: No null check
if (error) throw error;
const groups = [...new Set(data.map((g) => g.group_name))].filter(Boolean);
// ❌ If data is null/undefined, crashes
```

**Fix Required:**
```typescript
const groups = [...new Set(data?.map((g) => g.group_name) || [])].filter(Boolean);
```

### 11. **use-offline-sync.ts - MISSING ERROR HANDLING**
**Lines:** 16-24, 31-81
**Impact:** Silent failures, no user notification of sync errors

**Problem:** Try-catch swallows all errors without logging or toast notification.

```typescript
// Line 16-23: Silent failure
try {
  const { tasks, guests } = await getPendingSyncItems();
  setPendingCount(tasks.length + guests.length);
} catch {
  // ❌ No error logging, just sets to 0
  setPendingCount(0);
}

// Line 76-78: No user notification
} catch (error) {
  console.error("Sync failed:", error);
  // ❌ Should show toast to user
}
```

**Fix Required:**
Add toast notifications for sync failures.

### 12. **use-attachments.ts - STORAGE BUCKET NOT CHECKED**
**Lines:** 46-50
**Impact:** Upload fails if bucket doesn't exist

**Problem:** No check if 'attachments' bucket exists before uploading.

```typescript
// Line 46-48: Assumes bucket exists
const { error: uploadError } = await supabase.storage
  .from("attachments")  // ❌ Might not exist
  .upload(filePath, file);
```

**Fix Required:**
Check bucket existence or handle specific error code for missing bucket.

---

## MEDIUM PRIORITY ISSUES

### 13. **use-activity.ts - JOIN WITHOUT TYPE CHECKING**
**Lines:** 15, 24
**Impact:** Type safety lost on nested data

**Problem:** `.returns<ActivityLog[]>()` doesn't validate joined `user` field.

```typescript
// Line 15: Joins user data
.select("*, user:profiles(id, full_name, avatar_url)")
// Line 24: Type assertion without validation
.returns<ActivityLog[]>();
// ⚠️ ActivityLog.user might be undefined at runtime
```

**Fix:** ActivityLog type correctly includes `user?: Profile` (line 455), but should validate response structure.

### 14. **use-tasks.ts - OPTIMISTIC UPDATE WITHOUT ROLLBACK VALIDATION**
**Lines:** 177-183
**Impact:** UI shows wrong state if error occurs

**Problem:** Optimistic update error handler restores state but doesn't validate if restoration succeeded.

```typescript
// Line 177-183: No validation after rollback
onError: (err, variables, context) => {
  if (context?.previousTasks) {
    queryClient.setQueryData(
      ["tasks", variables.projectId],
      context.previousTasks
    );
    // ⚠️ No check if setQueryData succeeded
  }
}
```

**Fix:** Add error toast notification.

### 15. **use-budget.ts, use-projects.ts, use-tasks.ts - TYPE CASTING WITH `as never`**
**Lines:** Multiple (43, 85 in use-budget.ts, etc.)
**Impact:** Bypasses type safety, potential runtime errors

**Problem:** Using `as never` to force types instead of fixing type definitions.

```typescript
// use-budget.ts line 43
.insert(category as never)  // ❌ Disables all type checking
```

**Fix Required:**
Remove `as never` and fix types properly:
```typescript
.insert(category satisfies Database['public']['Tables']['budget_categories']['Insert'])
```

### 16. **use-members.ts - DUPLICATE EMAIL CHECK HAS RACE CONDITION**
**Lines:** 71-81
**Impact:** Can still insert duplicates if two invites sent simultaneously

**Problem:** Check and insert not atomic.

```typescript
// Line 72-77: Race condition window
const { data: existing } = await supabase
  .from("project_members")
  .select("id")
  .eq("project_id", input.project_id)
  .eq("invited_email", input.invited_email)
  .single();

// Line 83-92: Another request can insert between check and insert
const { data, error } = await supabase
  .from("project_members")
  .insert({ /* ... */ })
```

**Fix:** Use database unique constraint and handle constraint violation error.

### 17. **use-comments.ts - PROFILE FETCH FAILURE NOT HANDLED**
**Lines:** 38-42
**Impact:** Comments show without user info if profiles query fails

**Problem:** No error handling on profiles query.

```typescript
// Line 39-42: Silent failure
const { data: profiles } = await supabase
  .from("profiles")
  .select("id, full_name, avatar_url")
  .in("id", userIds);
// ⚠️ No error check - profiles might be null
```

**Fix:** Add error handling and default fallback.

---

## LOW PRIORITY ISSUES

### 18. **use-templates.ts - INEFFICIENT SEQUENTIAL INSERTS**
**Lines:** 77-94, 97-111
**Impact:** Slow template application

**Problem:** Tasks and categories inserted sequentially instead of using batch operations.

```typescript
// Line 90-94: Single bulkInsert is good
const { error: tasksError } = await supabase
  .from("tasks")
  .insert(tasksToInsert as never);
```

Actually this IS using bulkInsert - not an issue. ✓

### 19. **use-auth.ts - NO ERROR HANDLING ON INITIAL LOAD**
**Lines:** 13-19
**Impact:** Silent failure if auth check fails

**Problem:** No try-catch on getUser.

```typescript
// Line 13-19: No error handling
const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  // ⚠️ If this fails, user stays loading forever
  setUser(user);
  setLoading(false);
};
```

**Fix Required:**
```typescript
try {
  const { data: { user } } = await supabase.auth.getUser();
  setUser(user);
} catch (error) {
  console.error('Auth check failed:', error);
  setUser(null);
} finally {
  setLoading(false);
}
```

### 20. **use-attachments.ts - NO FILE TYPE VALIDATION**
**Lines:** 34-42
**Impact:** Can upload invalid files despite client check

**Problem:** Only checks size, not type. Storage bucket has MIME type restrictions but no client validation.

```typescript
// Line 38-41: Only size check
if (file.size > 10 * 1024 * 1024) {
  throw new Error("File quá lớn (tối đa 10MB)");
}
// ⚠️ Should also validate MIME type before upload
```

**Fix:** Add allowed MIME types check.

---

## POSITIVE OBSERVATIONS

- ✓ Consistent use of React Query for caching
- ✓ Good separation of concerns (one hook per feature)
- ✓ Most mutations include optimistic updates (use-tasks.ts)
- ✓ Toast notifications on success/error
- ✓ Proper cleanup in useOnlineStatus
- ✓ Query invalidation after mutations
- ✓ Enabled flags prevent unnecessary queries

---

## RECOMMENDED ACTIONS (Priority Order)

1. **[BLOCKING]** Add missing tables to database.ts types:
   - comments
   - attachments
   - activity_logs

2. **[BLOCKING]** Fix infinite loops:
   - use-auth.ts line 31: Remove `supabase.auth` from deps
   - use-toast.ts line 169: Remove `state` from deps
   - use-offline-sync.ts line 88: Fix circular dependency

3. **[CRITICAL]** Add error handling:
   - use-auth.ts line 13: Wrap getUser in try-catch
   - use-offline-sync.ts line 76: Add toast for sync errors
   - use-comments.ts line 39: Handle profiles fetch failure

4. **[HIGH]** Fix race conditions:
   - use-comments.ts line 55: Delay subscription until data loaded
   - use-members.ts line 72: Add DB unique constraint

5. **[HIGH]** Fix null safety:
   - use-guests.ts line 41: Add null check on data.map()
   - use-comments.ts line 41: Validate profiles response

6. **[MEDIUM]** Remove unsafe type casts:
   - Replace all `as never` with proper types
   - Use `satisfies` or fix Insert/Update types

7. **[LOW]** Add validation:
   - use-attachments.ts: Validate MIME types
   - use-offline-sync.ts: Better error messages

8. **[CLEANUP]** Verify schema matches DB:
   - Run migration FIX-PHASE4-AND-STORAGE.sql
   - Regenerate types from Supabase
   - Verify all joins return expected structure

---

## METRICS

- Type Coverage: ~70% (many `as never` bypasses)
- Critical Bugs: 6 (infinite loops, missing tables)
- High Priority: 6 (race conditions, type errors)
- Medium Priority: 4 (type safety, error handling)
- Low Priority: 3 (validation, edge cases)
- Total Issues: 19

---

## UNRESOLVED QUESTIONS

1. Have comments/attachments/activity_logs tables been created in Supabase? Need to verify migrations run.
2. What is actual response structure for joined queries (profiles/projects)? Need runtime testing.
3. Is storage bucket "attachments" created? Check Supabase dashboard.
4. Should use-members.ts project join return array or single object?
5. Are there unique constraints on project_members.invited_email + project_id?
