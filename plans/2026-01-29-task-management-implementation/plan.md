# Implementation Plan: Personal Task Management System

**Created:** 2026-01-29
**Status:** Phase 4 Complete
**Project:** task-management
**Last Updated:** 2026-01-30

---

## Overview

Build "Mini-ERP cá nhân" for wedding planning and personal projects. Multi-project, multi-user, offline-first PWA with Google Sheets integration.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- TanStack Query + Zustand
- PWA: @ducanh2912/next-pwa + Dexie.js (IndexedDB)

## Phase Overview

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1 | [Core MVP](./phase-01-core-mvp.md) | ✅ DONE | 100% |
| 2 | [Essential Features](./phase-02-essential-features.md) | ✅ DONE | 100% |
| 3 | [Enhanced UX](./phase-03-enhanced-ux.md) | ✅ DONE | 100% |
| 4 | [Polish](./phase-04-polish.md) | ✅ DONE | 95% |

## Dependencies

```
Phase 1 (Core MVP)
    ↓
Phase 2 (Essential Features) ← Google Sheets API credentials required
    ↓
Phase 3 (Enhanced UX) ← VAPID keys for push notifications
    ↓
Phase 4 (Polish)
```

## File Structure (Target)

```
src/
├── app/
│   ├── (auth)/login, signup, auth/callback
│   ├── (dashboard)/dashboard, projects/[id], tasks, budget, guests, timeline
│   ├── api/ (route handlers)
│   └── layout.tsx, providers.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/, projects/, tasks/, budget/, guests/, timeline/
│   └── shared/
├── lib/
│   ├── supabase/ (client.ts, server.ts, middleware.ts)
│   ├── db.ts (Dexie IndexedDB)
│   ├── google-sheets.ts
│   └── utils.ts
├── hooks/ (useOfflineSync, useAuth, etc.)
├── stores/ (Zustand stores)
└── types/ (TypeScript definitions)
```

## Research References

- [Next.js + Supabase Patterns](./research/researcher-01-nextjs-supabase-patterns.md)
- [PWA Offline Strategies](./research/researcher-02-pwa-offline-strategies.md)
- [Brainstorm Report](../reports/brainstorm-2026-01-29-task-management-system.md)

## Success Criteria

- [x] Auth works (Google + Email)
- [x] CRUD operations for all entities
- [x] Offline mode works for critical operations (PWA + IndexedDB)
- [x] Google Sheets sync functional
- [x] < 3s initial load time
- [x] Comments & attachments with realtime updates
- [x] PDF export (project report, guest list)
- [x] Activity log tracking
- [ ] (Optional) Multi-language support
