# Phase 02: Eliminate Duplicate Fetches

**Parent:** [plan.md](./plan.md)
**Dependencies:** None (independent of Phase 01)
**Docs:** [codebase-summary](../../docs/codebase-summary.md)

## Overview
- **Date:** 2026-03-09
- **Description:** Remove redundant hooks that duplicate data fetching; derive computed data from existing queries
- **Priority:** HIGH
- **Implementation Status:** `pending`
- **Review Status:** `pending`

## Key Insights
- `useGuestStats(projectId)` calls `useGuests(projectId)` internally → when guests page uses both, React Query deduplicates the fetch but the hook overhead remains and is confusing
- `useGuestGroups(projectId)` makes a separate Supabase query just to get unique `group_name` values — trivially derivable from `useGuests` data
- Analytics page calls `useGuestStats(projectId)` which triggers `useGuests(projectId)` — fetches all guests just for 4 stat numbers

## Requirements
1. Convert `useGuestStats` from a hook to a pure utility function `computeGuestStats(guests: Guest[])`
2. Remove `useGuestGroups` hook; derive groups inline from guests data
3. Update all consumers to pass guests data explicitly
4. No behavioral changes — same stats, same groups displayed

## Architecture
**Before:**
```
GuestsPage → useGuests(id)     → fetch guests
           → useGuestGroups(id) → fetch guests (group_name only)
           → useGuestStats(id)  → useGuests(id) → fetch guests (redundant)
= 2 separate Supabase queries (useGuests dedup covers the 3rd)
```
**After:**
```
GuestsPage → useGuests(id) → fetch guests (single query)
           → computeGuestStats(guests)  // pure function, no fetch
           → deriveGroups(guests)        // inline computation, no fetch
= 1 Supabase query
```

## Related Code Files
| File | Change |
|------|--------|
| `src/hooks/use-guests.ts` | Remove `useGuestGroups`, convert `useGuestStats` to pure fn |
| `src/app/(dashboard)/projects/[id]/guests/page.tsx` | Use `computeGuestStats(guests)`, derive groups inline |
| `src/app/(dashboard)/projects/[id]/analytics/page.tsx` | Use `computeGuestStats(guests)` with useGuests data |

## Implementation Steps

### Step 1: Convert `useGuestStats` to pure function in `use-guests.ts`
**Current (lines 49-63):**
```typescript
export function useGuestStats(projectId: string) {
  const { data: guests } = useGuests(projectId);
  // ... computes stats from guests
}
```
**New:**
```typescript
export function computeGuestStats(guests: Guest[] | undefined) {
  if (!guests) return { total: 0, confirmed: 0, declined: 0, pending: 0, totalRsvpCount: 0, checkedIn: 0, invitationSent: 0 };
  return {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvp_status === "confirmed").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    totalRsvpCount: guests.reduce((sum, g) => sum + (g.rsvp_status === "confirmed" ? g.rsvp_count : 0), 0),
    checkedIn: guests.filter((g) => g.checked_in).length,
    invitationSent: guests.filter((g) => g.invitation_sent).length,
  };
}
```

### Step 2: Remove `useGuestGroups` hook from `use-guests.ts`
**Current (lines 28-47):** Separate query to get distinct group_name.
**Remove entirely.** Add helper:
```typescript
export function deriveGuestGroups(guests: Guest[] | undefined): string[] {
  if (!guests) return [];
  return [...new Set(guests.map((g) => g.group_name).filter(Boolean))] as string[];
}
```

### Step 3: Update `guests/page.tsx`
**Current (lines 47-49):**
```typescript
const { data: groups } = useGuestGroups(projectId);
const stats = useGuestStats(projectId);
```
**New:**
```typescript
const stats = useMemo(() => computeGuestStats(guests), [guests]);
const groups = useMemo(() => deriveGuestGroups(guests), [guests]);
```

### Step 4: Update `analytics/page.tsx`
**Current (line 9, 42):**
```typescript
import { useGuestStats } from "@/hooks/use-guests";
const guestStats = useGuestStats(projectId);
```
**New:**
```typescript
import { useGuests, computeGuestStats } from "@/hooks/use-guests";
const { data: guests } = useGuests(projectId);
const guestStats = useMemo(() => computeGuestStats(guests), [guests]);
```

## Todo
- [ ] Convert useGuestStats to computeGuestStats pure function
- [ ] Replace useGuestGroups with deriveGuestGroups utility
- [ ] Update guests/page.tsx imports and usage
- [ ] Update analytics/page.tsx imports and usage
- [ ] Verify GuestStats component still receives correct props
- [ ] Verify GuestFilters component still receives groups correctly
- [ ] Test: guest page loads with single API call
- [ ] Test: analytics page guest stats display correctly

## Success Criteria
- Guest page makes 1 Supabase query instead of 2-3
- Analytics page doesn't trigger separate guest fetch if already cached
- Same UI output — stats and group filters unchanged

## Risk Assessment
- **NONE:** Pure refactoring — same data, fewer fetches
- **LOW:** Analytics page now needs useGuests — but React Query caches it, minimal overhead

## Security Considerations
- No changes to data access patterns
- RLS policies unchanged

## Next Steps
After completion, proceed to Phase 03: Lazy Load Heavy Libraries
