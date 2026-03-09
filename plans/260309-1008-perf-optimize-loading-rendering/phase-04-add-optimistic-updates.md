# Phase 04: Add Optimistic Updates

**Parent:** [plan.md](./plan.md)
**Dependencies:** Phase 01 (comment types may change)
**Docs:** [codebase-summary](../../docs/codebase-summary.md)

## Overview
- **Date:** 2026-03-09
- **Description:** Add optimistic cache updates for create mutations to make UI feel instant
- **Priority:** MEDIUM
- **Implementation Status:** `pending`
- **Review Status:** `pending`

## Key Insights
- `useUpdateTaskStatus` already implements optimistic updates (use-tasks.ts lines 186-210) — proven pattern
- `useCreateTask`, `useAddComment`, `useCreateGuest` only invalidate cache on success → user waits 200-500ms
- Optimistic updates insert temporary data into cache immediately, rollback on error
- Need to generate temporary IDs for optimistic entries

## Requirements
1. Add `onMutate` optimistic cache insertion for `useCreateTask`
2. Add `onMutate` optimistic cache insertion for `useAddComment`
3. Add `onMutate` optimistic cache insertion for `useCreateGuest`
4. Rollback on error with `onError` context
5. Reconcile with server data via `onSettled` invalidation

## Architecture
**Pattern (from existing useUpdateTaskStatus):**
```typescript
onMutate: async (newItem) => {
  await queryClient.cancelQueries({ queryKey });
  const previous = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, (old) => [...(old || []), optimisticItem]);
  return { previous };
},
onError: (err, vars, context) => {
  queryClient.setQueryData(queryKey, context?.previous);
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey });
}
```

## Related Code Files
| File | Mutation | Change |
|------|----------|--------|
| `src/hooks/use-tasks.ts` | `useCreateTask` (lines 66-97) | Add onMutate/onError optimistic |
| `src/hooks/use-comments.ts` | `useAddComment` (lines 82-125) | Add onMutate/onError optimistic |
| `src/hooks/use-guests.ts` | `useCreateGuest` (lines 77-109) | Add onMutate/onError optimistic |

## Implementation Steps

### Step 1: Add optimistic update to `useCreateTask`
**Current (lines 82-87):** Only `onSuccess` invalidates.
**New:**
```typescript
onMutate: async (newTask) => {
  await queryClient.cancelQueries({ queryKey: ["tasks", newTask.project_id] });
  const previous = queryClient.getQueryData<Task[]>(["tasks", newTask.project_id]);
  const optimistic: Task = {
    id: `temp-${Date.now()}`,
    ...newTask,
    status: newTask.status || "todo",
    priority: newTask.priority || "medium",
    estimated_cost: newTask.estimated_cost || 0,
    actual_cost: newTask.actual_cost || 0,
    position: (previous?.length || 0) + 1,
    created_at: new Date().toISOString(),
  } as Task;
  queryClient.setQueryData<Task[]>(["tasks", newTask.project_id], (old) => [...(old || []), optimistic]);
  return { previous };
},
onError: (err, newTask, context) => {
  if (context?.previous) {
    queryClient.setQueryData(["tasks", newTask.project_id], context.previous);
  }
},
onSettled: (data) => {
  if (data) queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
},
```
- Move toast to `onSettled` or keep in `onSuccess`

### Step 2: Add optimistic update to `useAddComment`
**Current (lines 114-115):** Only invalidates on success.
**New:**
```typescript
onMutate: async ({ taskId, content }) => {
  await queryClient.cancelQueries({ queryKey: ["comments", taskId] });
  const previous = queryClient.getQueryData<Comment[]>(["comments", taskId]);
  const optimistic: Comment = {
    id: `temp-${Date.now()}`,
    task_id: taskId,
    user_id: "current-user",
    content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  queryClient.setQueryData<Comment[]>(["comments", taskId], (old) => [...(old || []), optimistic]);
  return { previous, taskId };
},
onError: (err, vars, context) => {
  if (context?.previous) {
    queryClient.setQueryData(["comments", context.taskId], context.previous);
  }
},
onSettled: (_, __, { taskId }) => {
  queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
},
```
- Note: optimistic comment won't have user profile — acceptable since real data replaces it quickly

### Step 3: Add optimistic update to `useCreateGuest`
**Current (lines 93-95):** Only invalidates on success.
**New:**
```typescript
onMutate: async (newGuest) => {
  await queryClient.cancelQueries({ queryKey: ["guests", newGuest.project_id] });
  const previous = queryClient.getQueryData<Guest[]>(["guests", newGuest.project_id]);
  const optimistic: Guest = {
    id: `temp-${Date.now()}`,
    ...newGuest,
    invitation_sent: false,
    invitation_sent_at: null,
    rsvp_status: newGuest.rsvp_status || "pending",
    rsvp_count: newGuest.rsvp_count || 1,
    table_number: newGuest.table_number || null,
    qr_code: null,
    checked_in: false,
    checked_in_at: null,
    gift_amount: null,
    source: "manual",
    external_id: null,
    created_at: new Date().toISOString(),
  } as Guest;
  queryClient.setQueryData<Guest[]>(["guests", newGuest.project_id], (old) => [optimistic, ...(old || [])]);
  return { previous };
},
onError: (err, newGuest, context) => {
  if (context?.previous) {
    queryClient.setQueryData(["guests", newGuest.project_id], context.previous);
  }
},
onSettled: (data) => {
  if (data) {
    queryClient.invalidateQueries({ queryKey: ["guests", data.project_id] });
    queryClient.invalidateQueries({ queryKey: ["guest_groups", data.project_id] });
  }
},
```

## Todo
- [ ] Add optimistic update to useCreateTask
- [ ] Add optimistic update to useAddComment
- [ ] Add optimistic update to useCreateGuest
- [ ] Test: new task appears instantly in kanban/table
- [ ] Test: new comment appears instantly in list
- [ ] Test: new guest appears instantly in table
- [ ] Test: rollback works on error (disconnect network, try create)
- [ ] Test: final data reconciled after server response

## Success Criteria
- Create actions feel instant (<50ms perceived)
- Items appear in UI before server responds
- On error, UI reverts to previous state
- After server response, data reconciled (temp ID replaced with real ID)

## Risk Assessment
- **LOW:** Optimistic data might briefly show incomplete info (no profile on comment) — acceptable
- **LOW:** If Phase 01 changes Comment type, adjust optimistic shape accordingly
- **NONE:** Rollback mechanism prevents data inconsistency

## Security Considerations
- No security implications — optimistic data is client-side only
- Server still validates and enforces RLS

## Next Steps
All phases complete. Run full test suite and verify performance improvement.
