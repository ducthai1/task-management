-- Phase 1: Initial Schema - Core Tables
-- Run this FIRST in Supabase SQL Editor before Phase 2

-- 1. Profiles Table (linked to auth.users)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_budget_project ON budget_categories(project_id);

-- RLS Policies for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select_policy ON projects
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY projects_insert_policy ON projects
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY projects_update_policy ON projects
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY projects_delete_policy ON projects
  FOR DELETE USING (owner_id = auth.uid());

-- RLS Policies for Tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_policy ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- RLS Policies for Budget Categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_categories_policy ON budget_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_categories.project_id
      AND projects.owner_id = auth.uid()
    )
  );
