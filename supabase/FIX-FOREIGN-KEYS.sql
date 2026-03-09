-- ============================================
-- FIX FOREIGN KEYS FOR SUPABASE JOINS
-- Run this in Supabase SQL Editor
-- ============================================

-- Add FK from comments.user_id to profiles.id (for Supabase joins)
-- First check if constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE comments
    ADD CONSTRAINT comments_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from attachments.uploaded_by to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attachments_uploaded_by_profiles_fkey'
  ) THEN
    ALTER TABLE attachments
    ADD CONSTRAINT attachments_uploaded_by_profiles_fkey
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add FK from activity_logs.user_id to profiles.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_user_id_profiles_fkey'
  ) THEN
    ALTER TABLE activity_logs
    ADD CONSTRAINT activity_logs_user_id_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- DONE!
-- ============================================
