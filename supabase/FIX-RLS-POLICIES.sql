-- ============================================
-- FIX RLS POLICIES - Run this to fix 500 errors
-- ============================================

-- First, ensure all existing users have profiles
INSERT INTO profiles (id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- Fix projects policies - make them simpler and more reliable
DROP POLICY IF EXISTS projects_select_policy ON projects;
DROP POLICY IF EXISTS projects_insert_policy ON projects;
DROP POLICY IF EXISTS projects_update_policy ON projects;
DROP POLICY IF EXISTS projects_delete_policy ON projects;

CREATE POLICY projects_select_policy ON projects
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY projects_insert_policy ON projects
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY projects_update_policy ON projects
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY projects_delete_policy ON projects
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Fix tasks policies
DROP POLICY IF EXISTS tasks_policy ON tasks;
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_modify_policy ON tasks;

CREATE POLICY tasks_all_policy ON tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Fix budget_categories policies
DROP POLICY IF EXISTS budget_categories_policy ON budget_categories;
DROP POLICY IF EXISTS budget_categories_select_policy ON budget_categories;
DROP POLICY IF EXISTS budget_categories_modify_policy ON budget_categories;

CREATE POLICY budget_categories_all_policy ON budget_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_categories.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Fix guests policies
DROP POLICY IF EXISTS guests_select_policy ON guests;
DROP POLICY IF EXISTS guests_insert_policy ON guests;
DROP POLICY IF EXISTS guests_update_policy ON guests;
DROP POLICY IF EXISTS guests_delete_policy ON guests;

CREATE POLICY guests_all_policy ON guests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = guests.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Fix project_members policies
DROP POLICY IF EXISTS members_select_policy ON project_members;
DROP POLICY IF EXISTS members_insert_policy ON project_members;
DROP POLICY IF EXISTS members_update_policy ON project_members;
DROP POLICY IF EXISTS members_delete_policy ON project_members;

CREATE POLICY project_members_all_policy ON project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Fix sync_logs policies
DROP POLICY IF EXISTS sync_logs_policy ON sync_logs;

CREATE POLICY sync_logs_all_policy ON sync_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sync_logs.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Fix templates policies - allow reading system templates
DROP POLICY IF EXISTS templates_select_policy ON templates;
DROP POLICY IF EXISTS templates_insert_policy ON templates;
DROP POLICY IF EXISTS templates_update_policy ON templates;
DROP POLICY IF EXISTS templates_delete_policy ON templates;

CREATE POLICY templates_select_policy ON templates
  FOR SELECT TO authenticated
  USING (is_system = true OR created_by = auth.uid());

CREATE POLICY templates_insert_policy ON templates
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY templates_update_policy ON templates
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

CREATE POLICY templates_delete_policy ON templates
  FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND is_system = false);

-- Fix profiles policies
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;

CREATE POLICY profiles_select_policy ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_insert_policy ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_policy ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ============================================
-- DONE! Refresh page and try again.
-- ============================================
