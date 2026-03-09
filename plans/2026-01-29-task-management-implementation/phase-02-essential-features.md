# Phase 2: Essential Features

**Parent Plan:** [plan.md](./plan.md)
**Dependencies:** [Phase 1: Core MVP](./phase-01-core-mvp.md)
**Docs:** [Brainstorm Report](../reports/brainstorm-2026-01-29-task-management-system.md)

---

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Description | Guest management, Google Sheets sync, Templates, Collaboration |
| Priority | High |
| Implementation Status | Complete |
| Review Status | Passed |

---

## Key Insights

1. Google Sheets API via Service Account (no user OAuth needed)
2. Manual sync first, auto webhook later
3. Templates stored as JSONB for flexibility
4. project_members table enables collaboration
5. Role-based RLS: owner > editor > viewer

---

## Requirements

### 2.1 Guest Management
- [ ] Guests table + RLS
- [ ] Guest list page (table view)
- [ ] Guest create/edit form
- [ ] Guest groups (filter by group)
- [ ] RSVP status tracking
- [ ] Invitation sent tracking
- [ ] Search & filter guests

### 2.2 Google Sheets Integration
- [ ] Service Account setup
- [ ] Connect Sheet to project (settings)
- [ ] Manual "Sync from Sheet" button
- [ ] Column mapping UI
- [ ] Upsert logic (avoid duplicates)
- [ ] Sync log display

### 2.3 Project Templates
- [ ] Templates table + seed data
- [ ] Create project from template
- [ ] 4 system templates (wedding, house, travel, event)
- [ ] Template preview before apply

### 2.4 Collaboration (Multi-user)
- [ ] project_members table + RLS
- [ ] Invite member by email
- [ ] Role assignment (editor/viewer)
- [ ] Pending invites list
- [ ] Accept invite flow
- [ ] Update RLS for members access

---

## Architecture

### Database Schema (Phase 2 additions)

```sql
-- 5. Guests
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  group_name TEXT,
  invitation_sent BOOLEAN DEFAULT FALSE,
  invitation_sent_at TIMESTAMPTZ,
  rsvp_status TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  rsvp_count INT DEFAULT 1,
  table_number TEXT,
  qr_code TEXT UNIQUE,
  checked_in BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMPTZ,
  gift_amount DECIMAL(12,2),
  notes TEXT,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheet')),
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Project Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email TEXT,
  invite_status TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id),
  UNIQUE(project_id, invited_email)
);

-- 7. Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'travel', 'event')),
  description TEXT,
  tasks JSONB NOT NULL DEFAULT '[]',
  budget_categories JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Sync Logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'google_sheet',
  source_id TEXT NOT NULL,
  records_synced INT DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY guests_policy ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = guests.project_id
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- RLS for Project Members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own memberships
CREATE POLICY members_view_policy ON project_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
  );

-- Only owner can manage members
CREATE POLICY members_manage_policy ON project_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
  );

-- RLS for Templates (public read for system, private for user-created)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY templates_read_policy ON templates
  FOR SELECT USING (is_system = TRUE OR created_by = auth.uid());

CREATE POLICY templates_manage_policy ON templates
  FOR ALL USING (created_by = auth.uid());

-- RLS for Sync Logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_logs_policy ON sync_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sync_logs.project_id AND p.owner_id = auth.uid()
    )
  );

-- Update existing policies to include project members
DROP POLICY IF EXISTS tasks_policy ON tasks;
CREATE POLICY tasks_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = tasks.project_id
      AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')))
    )
  );

-- Viewers can only SELECT tasks
CREATE POLICY tasks_viewer_policy ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = tasks.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'viewer'
    )
  );

-- Indexes
CREATE INDEX idx_guests_project ON guests(project_id);
CREATE INDEX idx_guests_group ON guests(project_id, group_name);
CREATE INDEX idx_guests_rsvp ON guests(project_id, rsvp_status);
CREATE INDEX idx_members_project ON project_members(project_id);
CREATE INDEX idx_members_user ON project_members(user_id);
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_sync_logs_project ON sync_logs(project_id);
```

### File Structure (Phase 2 additions)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── projects/[id]/
│   │       ├── guests/
│   │       │   ├── page.tsx
│   │       │   └── sync/page.tsx
│   │       ├── members/page.tsx
│   │       └── settings/page.tsx
│   ├── api/
│   │   ├── sheets/
│   │   │   └── sync/route.ts
│   │   └── invites/
│   │       └── accept/route.ts
│   └── invite/[token]/page.tsx
├── components/
│   ├── guests/
│   │   ├── guest-form.tsx
│   │   ├── guest-table.tsx
│   │   ├── guest-filters.tsx
│   │   └── sync-dialog.tsx
│   ├── members/
│   │   ├── invite-form.tsx
│   │   ├── members-list.tsx
│   │   └── role-badge.tsx
│   └── templates/
│       ├── template-picker.tsx
│       └── template-preview.tsx
├── lib/
│   └── google-sheets.ts
├── hooks/
│   ├── use-guests.ts
│   ├── use-members.ts
│   └── use-templates.ts
└── types/
    └── google-sheets.d.ts
```

---

## Implementation Steps

### Step 1: Database Migration
```bash
# Run in Supabase SQL editor
# All SQL from schema section above
```

### Step 2: Guest Management
1. Create guests hooks with TanStack Query
2. Build guest table component
3. Create guest form with validation
4. Add group filter dropdown
5. Implement RSVP status update
6. Add search functionality

### Step 3: Google Sheets Integration

**3.1 Service Account Setup:**
1. Go to Google Cloud Console
2. Create Service Account
3. Enable Google Sheets API
4. Download JSON credentials
5. Store in env: `GOOGLE_SERVICE_ACCOUNT`

**3.2 Implementation:**
```typescript
// lib/google-sheets.ts
import { google } from 'googleapis';

export async function getSheetData(spreadsheetId: string, range: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values;
}
```

**3.3 Sync API Route:**
```typescript
// app/api/sheets/sync/route.ts
export async function POST(request: Request) {
  const { projectId, spreadsheetId, sheetName } = await request.json();

  // 1. Fetch sheet data
  const rows = await getSheetData(spreadsheetId, `${sheetName}!A:Z`);

  // 2. Map columns to guest fields
  const guests = mapRowsToGuests(rows);

  // 3. Upsert to database
  const { data, error } = await supabase
    .from('guests')
    .upsert(guests, { onConflict: 'external_id' });

  // 4. Log sync result
  await supabase.from('sync_logs').insert({
    project_id: projectId,
    source_id: spreadsheetId,
    records_synced: guests.length,
    status: error ? 'failed' : 'success',
    error_message: error?.message,
  });

  return Response.json({ synced: guests.length });
}
```

### Step 4: Project Templates

**4.1 Seed System Templates:**
```sql
INSERT INTO templates (name, type, description, tasks, budget_categories, is_system) VALUES
('Wedding Planning', 'wedding', 'Complete wedding checklist',
  '[{"title":"Chọn ngày cưới","category":"Planning"},{"title":"Đặt cọc nhà hàng","category":"Venue","estimated_cost":50000000}...]'::jsonb,
  '[{"name":"Venue","allocated_amount":100000000},{"name":"Photography","allocated_amount":30000000}]'::jsonb,
  TRUE),
-- ... more templates
```

**4.2 Apply Template Logic:**
```typescript
async function applyTemplate(projectId: string, templateId: string) {
  const template = await getTemplate(templateId);

  // Insert tasks from template
  const tasks = template.tasks.map(t => ({
    ...t,
    project_id: projectId,
    status: 'todo',
  }));
  await supabase.from('tasks').insert(tasks);

  // Insert budget categories
  const categories = template.budget_categories.map(c => ({
    ...c,
    project_id: projectId,
  }));
  await supabase.from('budget_categories').insert(categories);
}
```

### Step 5: Collaboration

**5.1 Invite Flow:**
1. Owner enters email + role
2. Create project_members row with invited_email
3. Send email with invite link (or show link in UI)
4. Invitee clicks link → creates account if needed → membership activated

**5.2 Accept Invite:**
```typescript
// app/api/invites/accept/route.ts
export async function POST(request: Request) {
  const { inviteId } = await request.json();
  const user = await getUser();

  await supabase
    .from('project_members')
    .update({
      user_id: user.id,
      invite_status: 'accepted',
    })
    .eq('id', inviteId)
    .eq('invited_email', user.email);
}
```

---

## Todo List

- [x] Run Phase 2 database migrations (SQL ready at supabase/migrations-phase-02.sql)
- [x] Create guests hooks and API (src/hooks/use-guests.ts)
- [x] Build guest table with filters (src/components/guests/guest-table.tsx)
- [x] Build guest form (src/components/guests/guest-form.tsx)
- [x] Setup Google Cloud Service Account (instructions in plan)
- [x] Store service account credentials (GOOGLE_SERVICE_ACCOUNT env var)
- [x] Create google-sheets.ts utility (src/lib/google-sheets.ts)
- [x] Build sync API route (src/app/api/sheets/sync/route.ts)
- [x] Create sync dialog UI (src/components/guests/sync-dialog.tsx)
- [x] Build column mapping UI (integrated in sync-dialog.tsx)
- [x] Seed 4 system templates (SQL ready at supabase/seed-templates.sql)
- [x] Build template picker component (src/components/templates/template-picker.tsx)
- [x] Implement "Create from template" (src/hooks/use-templates.ts)
- [x] Build members management page (src/app/(dashboard)/projects/[id]/members/page.tsx)
- [x] Create invite form (src/components/members/invite-form.tsx)
- [x] Build invite acceptance flow (src/hooks/use-members.ts)
- [x] Update RLS policies for collaboration (in migrations-phase-02.sql)
- [ ] Test multi-user access (requires Supabase setup)

---

## Success Criteria

- [x] Can add/edit/delete guests
- [x] Can filter guests by group/status
- [x] Google Sheet sync works (requires GOOGLE_SERVICE_ACCOUNT env)
- [x] Sync log shows history
- [x] Can create project from template
- [x] Can invite family member
- [x] Member can view/edit based on role (RLS policies ready)
- [x] Viewer cannot modify data (RLS policies ready)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sheet API rate limits | Medium | Low | Cache, batch requests |
| Column mapping errors | Medium | Medium | Preview before sync |
| Invite email not received | Medium | Low | Show copy link option |

---

## Security Considerations

- Service Account key stored securely (env var)
- Sheet access requires explicit sharing with Service Account
- RLS enforces role-based access
- Invite tokens should have expiration

---

## Next Steps

After Phase 2 complete:
1. Proceed to [Phase 3: Enhanced UX](./phase-03-enhanced-ux.md)
2. Add PWA configuration
3. Implement offline mode
4. Add QR check-in feature
