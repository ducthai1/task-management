-- Phase 2: Essential Features - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Guests Table
CREATE TABLE IF NOT EXISTS guests (
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

-- 2. Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
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

-- 3. Templates Table
CREATE TABLE IF NOT EXISTS templates (
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

-- 4. Sync Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'google_sheet',
  source_id TEXT NOT NULL,
  records_synced INT DEFAULT 0,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guests_project ON guests(project_id);
CREATE INDEX IF NOT EXISTS idx_guests_group ON guests(project_id, group_name);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp ON guests(project_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_external ON guests(project_id, external_id);
CREATE INDEX IF NOT EXISTS idx_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON project_members(invited_email);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_project ON sync_logs(project_id);

-- RLS for Guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY guests_select_policy ON guests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = guests.project_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

CREATE POLICY guests_insert_policy ON guests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = guests.project_id
      AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
    )
  );

CREATE POLICY guests_update_policy ON guests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = guests.project_id
      AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
    )
  );

CREATE POLICY guests_delete_policy ON guests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = guests.project_id
      AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
    )
  );

-- RLS for Project Members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Members can view memberships of projects they belong to
CREATE POLICY members_select_policy ON project_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

-- Only owner can insert/update/delete members
CREATE POLICY members_insert_policy ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY members_update_policy ON project_members
  FOR UPDATE USING (
    -- Owner can update any member
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
    -- Or user can update their own membership (e.g., accept invite)
    OR (
      user_id = auth.uid()
      OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY members_delete_policy ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid()
    )
  );

-- RLS for Templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Anyone can read system templates, users can read their own
CREATE POLICY templates_select_policy ON templates
  FOR SELECT USING (is_system = TRUE OR created_by = auth.uid());

-- Users can only manage their own templates
CREATE POLICY templates_insert_policy ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = FALSE);

CREATE POLICY templates_update_policy ON templates
  FOR UPDATE USING (created_by = auth.uid() AND is_system = FALSE);

CREATE POLICY templates_delete_policy ON templates
  FOR DELETE USING (created_by = auth.uid() AND is_system = FALSE);

-- RLS for Sync Logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY sync_logs_policy ON sync_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = sync_logs.project_id
      AND (p.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm
        WHERE pm.project_id = p.id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('owner', 'editor')
      ))
    )
  );

-- Update existing tasks policy to include project members
DROP POLICY IF EXISTS tasks_policy ON tasks;

CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = tasks.project_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

CREATE POLICY tasks_modify_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = tasks.project_id
      AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
    )
  );

-- Update budget_categories policy similarly
DROP POLICY IF EXISTS budget_categories_policy ON budget_categories;

CREATE POLICY budget_categories_select_policy ON budget_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = budget_categories.project_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

CREATE POLICY budget_categories_modify_policy ON budget_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = budget_categories.project_id
      AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
    )
  );
