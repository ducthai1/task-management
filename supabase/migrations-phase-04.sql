-- Phase 4: Polish - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Comments Table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attachments Table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'guest', 'budget', 'member')),
  entity_id UUID NOT NULL,
  entity_name TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_project ON activity_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON activity_logs(entity_type, entity_id);

-- RLS for Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Can read comments if has access to task's project
CREATE POLICY comments_select_policy ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE t.id = comments.task_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

-- Can insert comments if editor/owner
CREATE POLICY comments_insert_policy ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE t.id = comments.task_id
      AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')))
    )
  );

-- Can only update own comments
CREATE POLICY comments_update_policy ON comments
  FOR UPDATE USING (user_id = auth.uid());

-- Can only delete own comments
CREATE POLICY comments_delete_policy ON comments
  FOR DELETE USING (user_id = auth.uid());

-- RLS for Attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY attachments_select_policy ON attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE t.id = attachments.task_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

CREATE POLICY attachments_insert_policy ON attachments
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE t.id = attachments.task_id
      AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')))
    )
  );

CREATE POLICY attachments_delete_policy ON attachments
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = attachments.task_id AND p.owner_id = auth.uid()
    )
  );

-- RLS for Activity Logs (read-only for project members)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_select_policy ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = auth.uid()
      WHERE p.id = activity_logs.project_id
      AND (p.owner_id = auth.uid() OR pm.id IS NOT NULL)
    )
  );

CREATE POLICY activity_logs_insert_policy ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Storage bucket for attachments (run this separately in Storage settings)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
