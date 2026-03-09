# Supabase Database Setup

## Fresh database setup

Run **one file only**:

```
supabase/COMPLETE-MIGRATION.sql
```

Paste the entire contents into the Supabase SQL Editor and click **Run**.

The file is idempotent — safe to run multiple times on the same database without errors.

## What COMPLETE-MIGRATION.sql contains

1. Extensions
2. All tables (profiles, projects, tasks, budget_categories, guests, project_members, templates, sync_logs, comments, attachments, activity_logs)
3. Foreign key constraints, including performance FKs that enable PostgREST single-query JOINs
4. Indexes
5. RLS policies (fixed working versions)
6. Storage bucket (`attachments`, 50 MB limit)
7. `handle_new_user` trigger (auto-creates profile on signup)
8. Seed data (4 system templates: wedding, house, travel, event)

## Legacy files (reference only)

The individual migration files below are kept for historical reference. Do not run them on a fresh database — use `COMPLETE-MIGRATION.sql` instead.

| File | Description |
|------|-------------|
| `migrations-phase-01-initial.sql` | Phase 1: core tables |
| `migrations-phase-02.sql` | Phase 2: guests, members, templates, sync_logs |
| `migrations-phase-04.sql` | Phase 4: comments, attachments, activity_logs |
| `FULL-MIGRATION-RUN-THIS.sql` | Earlier combined migration (superseded) |
| `FIX-RLS-POLICIES.sql` | RLS hotfix applied after phase 2 |
| `FIX-FOREIGN-KEYS.sql` | FK hotfix for Supabase joins |
| `FIX-PHASE4-AND-STORAGE.sql` | Phase 4 hotfix + storage bucket |
| `RUN-THIS-PERF-FIX-FOREIGN-KEYS.sql` | Performance FK fix for JOIN queries |
| `seed-templates.sql` | System template seed data |
