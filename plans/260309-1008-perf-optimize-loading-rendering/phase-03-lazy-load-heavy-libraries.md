# Phase 03: Lazy Load Heavy Libraries

**Parent:** [plan.md](./plan.md)
**Dependencies:** None (independent)
**Docs:** [codebase-summary](../../docs/codebase-summary.md)

## Overview
- **Date:** 2026-03-09
- **Description:** Lazy load react-big-calendar to reduce initial bundle size on calendar page
- **Priority:** MEDIUM
- **Implementation Status:** `pending`
- **Review Status:** `pending`

## Key Insights
- `react-big-calendar` is ~250KB uncompressed, imported directly in `task-calendar.tsx`
- Calendar page loads this eagerly even though user may never visit it
- Analytics page already uses `next/dynamic` for recharts — proven pattern in codebase
- CSS import `react-big-calendar/lib/css/react-big-calendar.css` also loaded eagerly

## Requirements
1. Wrap `TaskCalendar` component import with `next/dynamic` in calendar page
2. Show skeleton placeholder while calendar loads
3. Keep CSS working (must be imported inside the dynamic component)
4. No functional changes to calendar behavior

## Architecture
**Before:**
```
calendar/page.tsx → import { TaskCalendar } from "@/components/calendar/task-calendar"
                  → TaskCalendar imports react-big-calendar + CSS
                  = 250KB loaded with page JS bundle
```
**After:**
```
calendar/page.tsx → dynamic(() => import("@/components/calendar/task-calendar"), { ssr: false })
                  → TaskCalendar + react-big-calendar loaded only when calendar page visited
                  = 250KB loaded on-demand
```

## Related Code Files
| File | Change |
|------|--------|
| `src/app/(dashboard)/projects/[id]/calendar/page.tsx` | Use dynamic import for TaskCalendar |
| `src/components/calendar/task-calendar.tsx` | No changes needed (CSS already inside) |

## Implementation Steps

### Step 1: Update `calendar/page.tsx` to use dynamic import
**Current (line 8):**
```typescript
import { TaskCalendar } from "@/components/calendar/task-calendar";
```
**New:**
```typescript
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const TaskCalendar = dynamic(
  () => import("@/components/calendar/task-calendar").then((mod) => mod.TaskCalendar),
  { loading: () => <Skeleton className="h-[600px]" />, ssr: false }
);
```
- Remove direct import of TaskCalendar
- Add `dynamic` and `Skeleton` imports
- `ssr: false` because react-big-calendar uses browser APIs

### Step 2: Remove redundant skeleton in page
**Current (lines 35-42):** Full page skeleton when loading.
**Keep as-is** — the page-level skeleton covers data loading, the dynamic loading skeleton covers component loading. They serve different purposes.

## Todo
- [ ] Replace static import with dynamic() in calendar/page.tsx
- [ ] Add loading skeleton for dynamic component
- [ ] Test: calendar page loads without errors
- [ ] Test: calendar renders tasks correctly after dynamic load
- [ ] Test: month/week/agenda views work
- [ ] Verify: JS bundle size reduced for non-calendar pages

## Success Criteria
- Calendar page loads react-big-calendar on-demand (~250KB saved from initial bundle)
- Skeleton shown while calendar component loads
- All calendar features work identically

## Risk Assessment
- **NONE:** Proven pattern already used for recharts in analytics page
- **LOW:** CSS might flash — but `ssr: false` + skeleton handles this

## Security Considerations
- No security implications

## Next Steps
After completion, proceed to Phase 04: Add Optimistic Updates
