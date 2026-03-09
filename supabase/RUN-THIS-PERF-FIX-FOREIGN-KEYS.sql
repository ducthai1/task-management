-- ============================================
-- PERFORMANCE FIX: FOREIGN KEYS FOR SUPABASE JOINS
-- ============================================
-- Run this ONCE in Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query → Paste → Run
--
-- WHY: These FKs enable Supabase PostgREST to do JOINs in a single query.
-- Without them, the app makes 2 sequential requests (N+1 pattern).
-- With them, the app makes 1 request with embedded profile data.
--
-- SAFE TO RUN MULTIPLE TIMES: Uses IF NOT EXISTS checks.
-- ============================================

-- 1. comments.user_id → profiles.id
-- Enables: useComments() to fetch comment + user profile in 1 query
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE comments
    ADD CONSTRAINT comments_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created: comments_user_id_profiles_fkey';
  ELSE
    RAISE NOTICE 'Already exists: comments_user_id_profiles_fkey';
  END IF;
END $$;

-- 2. activity_logs.user_id → profiles.id
-- Enables: useActivityLogs() to fetch log + user profile in 1 query
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE activity_logs
    ADD CONSTRAINT activity_logs_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created: activity_logs_user_id_profiles_fkey';
  ELSE
    RAISE NOTICE 'Already exists: activity_logs_user_id_profiles_fkey';
  END IF;
END $$;

-- 3. project_members.user_id → profiles.id
-- Enables: useProjectMembers() to fetch member + profile in 1 query
-- Note: project_members.user_id already references auth.users(id),
-- but profiles.id = auth.users.id, so this FK is valid.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_members_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE project_members
    ADD CONSTRAINT project_members_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created: project_members_user_id_profiles_fkey';
  ELSE
    RAISE NOTICE 'Already exists: project_members_user_id_profiles_fkey';
  END IF;
END $$;

-- 4. attachments.uploaded_by → profiles.id
-- Enables: future attachment queries with uploader profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attachments_uploaded_by_profiles_fkey'
  ) THEN
    ALTER TABLE attachments
    ADD CONSTRAINT attachments_uploaded_by_profiles_fkey
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created: attachments_uploaded_by_profiles_fkey';
  ELSE
    RAISE NOTICE 'Already exists: attachments_uploaded_by_profiles_fkey';
  END IF;
END $$;

-- ============================================
-- VERIFICATION: Run this to confirm all FKs exist
-- ============================================
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE conname IN (
  'comments_user_id_profiles_fkey',
  'activity_logs_user_id_profiles_fkey',
  'project_members_user_id_profiles_fkey',
  'attachments_uploaded_by_profiles_fkey'
)
ORDER BY conname;

-- Expected output: 4 rows, one for each FK.
-- ============================================
-- DONE! The app's JOIN queries will now work.
-- ============================================
