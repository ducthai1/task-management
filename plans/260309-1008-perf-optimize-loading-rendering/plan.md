# Performance Optimization: Loading & Rendering

**Date:** 2026-03-09
**Status:** Completed
**Goal:** Reduce UI-BE coupling, fix N+1 queries, eliminate duplicate fetches, lazy load heavy libs, add optimistic updates

## Problem Summary
- 100% client-side rendering — no SSR, all data fetched post-hydration
- N+1 query pattern in comments/members/activity hooks (2 sequential requests instead of 1)
- Duplicate fetches: useGuestStats calls useGuests internally, useGuestGroups separate query
- react-big-calendar (~250KB) loaded eagerly
- No optimistic updates on create mutations — user waits for server response

## Implementation Phases

| Phase | Name | Status | Priority | Files |
|-------|------|--------|----------|-------|
| 01 | [Fix N+1 Queries with Supabase JOINs](./phase-01-fix-n-plus-1-queries.md) | `done` | HIGH | use-comments.ts, use-members.ts, use-activity.ts |
| 02 | [Eliminate Duplicate Fetches](./phase-02-eliminate-duplicate-fetches.md) | `done` | HIGH | use-guests.ts, guests/page.tsx, analytics/page.tsx |
| 03 | [Lazy Load Heavy Libraries](./phase-03-lazy-load-heavy-libraries.md) | `done` | MEDIUM | calendar/page.tsx, task-calendar.tsx |
| 04 | [Add Optimistic Updates](./phase-04-add-optimistic-updates.md) | `done` | MEDIUM | use-tasks.ts, use-comments.ts, use-guests.ts |

## Expected Impact
- Phase 1: ~50% fewer API calls on comment/member/activity views
- Phase 2: ~30% fewer API calls on guest pages
- Phase 3: ~250KB less JS on initial calendar page load
- Phase 4: Perceived instant UI response on create actions

## Dependencies
- FK constraints for Supabase JOINs already exist in `supabase/FIX-FOREIGN-KEYS.sql`
- Must verify FKs are applied in production DB before Phase 1

## Reports
- [reports/](./reports/)
