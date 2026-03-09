-- ============================================
-- FIX PHASE 4 TABLES + STORAGE BUCKET
-- Run this in Supabase SQL Editor
-- ============================================

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

DROP POLICY IF EXISTS comments_select_policy ON comments;
DROP POLICY IF EXISTS comments_insert_policy ON comments;
DROP POLICY IF EXISTS comments_update_policy ON comments;
DROP POLICY IF EXISTS comments_delete_policy ON comments;

CREATE POLICY comments_all_policy ON comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = comments.task_id
      AND p.owner_id = auth.uid()
    )
  );

-- RLS for Attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attachments_select_policy ON attachments;
DROP POLICY IF EXISTS attachments_insert_policy ON attachments;
DROP POLICY IF EXISTS attachments_delete_policy ON attachments;

CREATE POLICY attachments_all_policy ON attachments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = attachments.task_id
      AND p.owner_id = auth.uid()
    )
  );

-- RLS for Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_select_policy ON activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_policy ON activity_logs;

CREATE POLICY activity_logs_all_policy ON activity_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_logs.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow owner deletes" ON storage.objects;

-- Allow authenticated users to upload to their project folders
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

-- Allow authenticated users to read attachments
CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

-- Allow users to delete their own uploads
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');

-- ============================================
-- DONE! Refresh page and try again.
-- ============================================
