-- ============================================
-- FULL DATABASE MIGRATION - RUN THIS ONCE
-- Copy entire content and paste into Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/gcjhrpooyfygglukhxky/sql
-- ============================================

-- =====================
-- PHASE 1: CORE TABLES
-- =====================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'travel', 'event')),
  start_date DATE,
  end_date DATE,
  owner_id UUID REFERENCES auth.users NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES tasks ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  assignee_id UUID REFERENCES auth.users,
  start_date DATE,
  due_date DATE,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Budget Categories Table
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  allocated_amount DECIMAL(12,2) DEFAULT 0,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Core Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_budget_project ON budget_categories(project_id);

-- RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;

CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (id = auth.uid());

-- RLS for Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS projects_select_policy ON projects;
DROP POLICY IF EXISTS projects_insert_policy ON projects;
DROP POLICY IF EXISTS projects_update_policy ON projects;
DROP POLICY IF EXISTS projects_delete_policy ON projects;

CREATE POLICY projects_select_policy ON projects FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY projects_insert_policy ON projects FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY projects_update_policy ON projects FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY projects_delete_policy ON projects FOR DELETE USING (owner_id = auth.uid());

-- RLS for Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_policy ON tasks;

CREATE POLICY tasks_policy ON tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.owner_id = auth.uid())
);

-- RLS for Budget Categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS budget_categories_policy ON budget_categories;

CREATE POLICY budget_categories_policy ON budget_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = budget_categories.project_id AND projects.owner_id = auth.uid())
);

-- =====================
-- PHASE 2: FEATURES
-- =====================

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

-- Phase 2 Indexes
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
DROP POLICY IF EXISTS guests_select_policy ON guests;
DROP POLICY IF EXISTS guests_insert_policy ON guests;
DROP POLICY IF EXISTS guests_update_policy ON guests;
DROP POLICY IF EXISTS guests_delete_policy ON guests;

CREATE POLICY guests_select_policy ON guests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = guests.project_id AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
  )
);

CREATE POLICY guests_insert_policy ON guests FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = guests.project_id
    AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
  )
);

CREATE POLICY guests_update_policy ON guests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = guests.project_id
    AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
  )
);

CREATE POLICY guests_delete_policy ON guests FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = guests.project_id
    AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
  )
);

-- RLS for Project Members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS members_select_policy ON project_members;
DROP POLICY IF EXISTS members_insert_policy ON project_members;
DROP POLICY IF EXISTS members_update_policy ON project_members;
DROP POLICY IF EXISTS members_delete_policy ON project_members;

CREATE POLICY members_select_policy ON project_members FOR SELECT USING (
  user_id = auth.uid()
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM project_members pm2 WHERE pm2.project_id = project_members.project_id AND pm2.user_id = auth.uid())
);

CREATE POLICY members_insert_policy ON project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);

CREATE POLICY members_update_policy ON project_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid())
  OR user_id = auth.uid()
  OR invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY members_delete_policy ON project_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_members.project_id AND owner_id = auth.uid())
);

-- RLS for Templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS templates_select_policy ON templates;
DROP POLICY IF EXISTS templates_insert_policy ON templates;
DROP POLICY IF EXISTS templates_update_policy ON templates;
DROP POLICY IF EXISTS templates_delete_policy ON templates;

CREATE POLICY templates_select_policy ON templates FOR SELECT USING (is_system = TRUE OR created_by = auth.uid());
CREATE POLICY templates_insert_policy ON templates FOR INSERT WITH CHECK (created_by = auth.uid() AND is_system = FALSE);
CREATE POLICY templates_update_policy ON templates FOR UPDATE USING (created_by = auth.uid() AND is_system = FALSE);
CREATE POLICY templates_delete_policy ON templates FOR DELETE USING (created_by = auth.uid() AND is_system = FALSE);

-- RLS for Sync Logs
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sync_logs_policy ON sync_logs;

CREATE POLICY sync_logs_policy ON sync_logs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = sync_logs.project_id
    AND (p.owner_id = auth.uid() OR EXISTS (
      SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')
    ))
  )
);

-- Update tasks policies for team access
DROP POLICY IF EXISTS tasks_policy ON tasks;
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_modify_policy ON tasks;

CREATE POLICY tasks_select_policy ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = tasks.project_id AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
  )
);

CREATE POLICY tasks_modify_policy ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = tasks.project_id
    AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
  )
);

-- Update budget_categories policies for team access
DROP POLICY IF EXISTS budget_categories_policy ON budget_categories;
DROP POLICY IF EXISTS budget_categories_select_policy ON budget_categories;
DROP POLICY IF EXISTS budget_categories_modify_policy ON budget_categories;

CREATE POLICY budget_categories_select_policy ON budget_categories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = budget_categories.project_id AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
  )
);

CREATE POLICY budget_categories_modify_policy ON budget_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = budget_categories.project_id
    AND (p.owner_id = auth.uid() OR (pm.id IS NOT NULL AND pm.role IN ('owner', 'editor')))
  )
);

-- ============================================
-- DONE! Now create profile for existing user
-- ============================================

-- Create profile for current logged-in user (if missing)
INSERT INTO profiles (id, full_name)
SELECT id, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS! Database is ready to use.
-- ============================================
