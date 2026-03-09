-- ============================================================
-- COMPLETE DATABASE MIGRATION
-- ============================================================
-- Safe to run on a fresh Supabase database.
-- IDEMPOTENT: Can be run multiple times without errors.
--
-- Includes:
--   - All tables (profiles, projects, tasks, budget_categories,
--     guests, project_members, templates, sync_logs,
--     comments, attachments, activity_logs)
--   - Foreign key constraints (incl. perf FK fixes for JOINs)
--   - Indexes
--   - RLS policies (fixed/working versions only)
--   - Storage bucket (attachments)
--   - Triggers (handle_new_user)
--   - Seed data (system templates)
-- ============================================================


-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================

-- uuid-ossp is available by default in Supabase; gen_random_uuid()
-- is used throughout and requires no explicit extension on PG 13+.
-- Enabling pgcrypto for compatibility if needed.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- SECTION 2: TABLES
-- ============================================================

-- ---------------------------
-- profiles
-- ---------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name  TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- projects
-- ---------------------------
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'travel', 'event')),
  start_date  DATE,
  end_date    DATE,
  owner_id    UUID REFERENCES auth.users NOT NULL,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- tasks
-- ---------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  parent_id      UUID REFERENCES tasks ON DELETE SET NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT DEFAULT 'todo'   CHECK (status   IN ('todo', 'in_progress', 'done')),
  priority       TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category       TEXT,
  assignee_id    UUID REFERENCES auth.users,
  start_date     DATE,
  due_date       DATE,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost    DECIMAL(12,2) DEFAULT 0,
  notes          TEXT,
  position       INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- budget_categories
-- ---------------------------
CREATE TABLE IF NOT EXISTS budget_categories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  allocated_amount DECIMAL(12,2) DEFAULT 0,
  color            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- guests
-- ---------------------------
CREATE TABLE IF NOT EXISTS guests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  phone               TEXT,
  email               TEXT,
  group_name          TEXT,
  invitation_sent     BOOLEAN DEFAULT FALSE,
  invitation_sent_at  TIMESTAMPTZ,
  rsvp_status         TEXT DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  rsvp_count          INT DEFAULT 1,
  table_number        TEXT,
  qr_code             TEXT UNIQUE,
  checked_in          BOOLEAN DEFAULT FALSE,
  checked_in_at       TIMESTAMPTZ,
  gift_amount         DECIMAL(12,2),
  notes               TEXT,
  source              TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_sheet')),
  external_id         TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- project_members
-- ---------------------------
CREATE TABLE IF NOT EXISTS project_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES auth.users,
  role           TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_email  TEXT,
  invite_status  TEXT DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'rejected')),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id),
  UNIQUE(project_id, invited_email)
);

-- ---------------------------
-- templates
-- ---------------------------
CREATE TABLE IF NOT EXISTS templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('wedding', 'house', 'travel', 'event')),
  description       TEXT,
  tasks             JSONB NOT NULL DEFAULT '[]',
  budget_categories JSONB DEFAULT '[]',
  is_system         BOOLEAN DEFAULT FALSE,
  created_by        UUID REFERENCES auth.users,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- sync_logs
-- ---------------------------
CREATE TABLE IF NOT EXISTS sync_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  source_type    TEXT NOT NULL DEFAULT 'google_sheet',
  source_id      TEXT NOT NULL,
  records_synced INT DEFAULT 0,
  status         TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  error_message  TEXT,
  synced_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- comments
-- ---------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- attachments
-- ---------------------------
CREATE TABLE IF NOT EXISTS attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  file_name   TEXT NOT NULL,
  file_path   TEXT NOT NULL,
  file_size   INT,
  file_type   TEXT,
  uploaded_by UUID REFERENCES auth.users NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------
-- activity_logs
-- ---------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'guest', 'budget', 'member')),
  entity_id   UUID NOT NULL,
  entity_name TEXT,
  changes     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SECTION 3: FOREIGN KEY CONSTRAINTS
-- (Performance FKs enabling PostgREST single-query JOINs)
-- ============================================================

-- comments.user_id → profiles.id
-- Enables useComments() to fetch comment + user profile in 1 query
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

-- activity_logs.user_id → profiles.id
-- Enables useActivityLogs() to fetch log + user profile in 1 query
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

-- project_members.user_id → profiles.id
-- Enables useProjectMembers() to fetch member + profile in 1 query
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

-- attachments.uploaded_by → profiles.id
-- Enables future attachment queries with uploader profile in 1 query
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


-- ============================================================
-- SECTION 4: INDEXES
-- ============================================================

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_id          ON profiles(id);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_owner       ON projects(owner_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project        ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due            ON tasks(project_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent         ON tasks(parent_id);

-- budget_categories
CREATE INDEX IF NOT EXISTS idx_budget_project       ON budget_categories(project_id);

-- guests
CREATE INDEX IF NOT EXISTS idx_guests_project       ON guests(project_id);
CREATE INDEX IF NOT EXISTS idx_guests_group         ON guests(project_id, group_name);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp          ON guests(project_id, rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_external      ON guests(project_id, external_id);

-- project_members
CREATE INDEX IF NOT EXISTS idx_members_project      ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_members_user         ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email        ON project_members(invited_email);

-- templates
CREATE INDEX IF NOT EXISTS idx_templates_type       ON templates(type);

-- sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_project    ON sync_logs(project_id);

-- comments
CREATE INDEX IF NOT EXISTS idx_comments_task        ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user        ON comments(user_id);

-- attachments
CREATE INDEX IF NOT EXISTS idx_attachments_task     ON attachments(task_id);

-- activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_project     ON activity_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity      ON activity_logs(entity_type, entity_id);


-- ============================================================
-- SECTION 5: RLS POLICIES
-- (Fixed versions only — broken/old policies excluded)
-- ============================================================

-- ---------------------------
-- profiles
-- ---------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
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

-- ---------------------------
-- projects
-- ---------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

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

-- ---------------------------
-- tasks
-- ---------------------------
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_policy        ON tasks;
DROP POLICY IF EXISTS tasks_select_policy ON tasks;
DROP POLICY IF EXISTS tasks_modify_policy ON tasks;
DROP POLICY IF EXISTS tasks_all_policy    ON tasks;

CREATE POLICY tasks_all_policy ON tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------
-- budget_categories
-- ---------------------------
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS budget_categories_policy          ON budget_categories;
DROP POLICY IF EXISTS budget_categories_select_policy   ON budget_categories;
DROP POLICY IF EXISTS budget_categories_modify_policy   ON budget_categories;
DROP POLICY IF EXISTS budget_categories_all_policy      ON budget_categories;

CREATE POLICY budget_categories_all_policy ON budget_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = budget_categories.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------
-- guests
-- ---------------------------
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS guests_select_policy ON guests;
DROP POLICY IF EXISTS guests_insert_policy ON guests;
DROP POLICY IF EXISTS guests_update_policy ON guests;
DROP POLICY IF EXISTS guests_delete_policy ON guests;
DROP POLICY IF EXISTS guests_all_policy    ON guests;

CREATE POLICY guests_all_policy ON guests
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = guests.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------
-- project_members
-- ---------------------------
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS members_select_policy      ON project_members;
DROP POLICY IF EXISTS members_insert_policy      ON project_members;
DROP POLICY IF EXISTS members_update_policy      ON project_members;
DROP POLICY IF EXISTS members_delete_policy      ON project_members;
DROP POLICY IF EXISTS project_members_all_policy ON project_members;

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

-- ---------------------------
-- templates
-- ---------------------------
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

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

-- ---------------------------
-- sync_logs
-- ---------------------------
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_logs_policy     ON sync_logs;
DROP POLICY IF EXISTS sync_logs_all_policy ON sync_logs;

CREATE POLICY sync_logs_all_policy ON sync_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sync_logs.project_id
        AND projects.owner_id = auth.uid()
    )
  );

-- ---------------------------
-- comments
-- ---------------------------
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_policy ON comments;
DROP POLICY IF EXISTS comments_insert_policy ON comments;
DROP POLICY IF EXISTS comments_update_policy ON comments;
DROP POLICY IF EXISTS comments_delete_policy ON comments;
DROP POLICY IF EXISTS comments_all_policy    ON comments;

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

-- ---------------------------
-- attachments
-- ---------------------------
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attachments_select_policy ON attachments;
DROP POLICY IF EXISTS attachments_insert_policy ON attachments;
DROP POLICY IF EXISTS attachments_delete_policy ON attachments;
DROP POLICY IF EXISTS attachments_all_policy    ON attachments;

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

-- ---------------------------
-- activity_logs
-- ---------------------------
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS activity_logs_select_policy ON activity_logs;
DROP POLICY IF EXISTS activity_logs_insert_policy ON activity_logs;
DROP POLICY IF EXISTS activity_logs_all_policy    ON activity_logs;

CREATE POLICY activity_logs_all_policy ON activity_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = activity_logs.project_id
        AND p.owner_id = auth.uid()
    )
  );


-- ============================================================
-- SECTION 6: STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  52428800, -- 50 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads"   ON storage.objects;
DROP POLICY IF EXISTS "Allow owner deletes"         ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated reads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments');

CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments');


-- ============================================================
-- SECTION 7: TRIGGERS
-- ============================================================

-- Auto-create a profile row when a new auth user signs up
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

-- Backfill profiles for any existing auth users that are missing one
INSERT INTO profiles (id, full_name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECTION 8: SEED DATA — SYSTEM TEMPLATES
-- ============================================================

INSERT INTO templates (name, type, description, tasks, budget_categories, is_system) VALUES

-- Wedding Template
('Đám cưới - Chuẩn bị toàn diện', 'wedding',
 'Template hoàn chỉnh cho việc lên kế hoạch đám cưới với đầy đủ các công việc và danh mục ngân sách',
 '[
   {"title": "Chọn ngày cưới và đặt lịch",        "category": "Lên kế hoạch", "priority": "urgent"},
   {"title": "Lập danh sách khách mời",             "category": "Khách mời",    "priority": "high"},
   {"title": "Tìm và đặt địa điểm tổ chức",         "category": "Địa điểm",     "priority": "urgent", "estimated_cost": 50000000},
   {"title": "Chọn và đặt nhà hàng/tiệc",           "category": "Địa điểm",     "priority": "high",   "estimated_cost": 100000000},
   {"title": "Thuê wedding planner (nếu cần)",       "category": "Lên kế hoạch", "priority": "medium", "estimated_cost": 20000000},
   {"title": "Chọn váy cưới/vest",                  "category": "Trang phục",   "priority": "high",   "estimated_cost": 30000000},
   {"title": "Đặt nhiếp ảnh & quay phim",           "category": "Lưu niệm",     "priority": "high",   "estimated_cost": 25000000},
   {"title": "Thiết kế và in thiệp cưới",            "category": "Khách mời",    "priority": "medium", "estimated_cost": 5000000},
   {"title": "Đặt hoa và trang trí",                "category": "Trang trí",    "priority": "medium", "estimated_cost": 15000000},
   {"title": "Book ban nhạc/DJ",                    "category": "Giải trí",     "priority": "medium", "estimated_cost": 10000000},
   {"title": "Đặt xe cưới",                         "category": "Vận chuyển",   "priority": "medium", "estimated_cost": 5000000},
   {"title": "Làm tóc và makeup",                   "category": "Trang phục",   "priority": "medium", "estimated_cost": 5000000},
   {"title": "Chuẩn bị quà cảm ơn khách",           "category": "Khách mời",    "priority": "low",    "estimated_cost": 10000000},
   {"title": "Gửi thiệp mời",                       "category": "Khách mời",    "priority": "high"},
   {"title": "Theo dõi RSVP",                       "category": "Khách mời",    "priority": "high"},
   {"title": "Xác nhận sắp xếp bàn tiệc",           "category": "Địa điểm",     "priority": "medium"},
   {"title": "Tổng duyệt trước ngày cưới",          "category": "Lên kế hoạch", "priority": "high"},
   {"title": "Chuẩn bị nhẫn cưới",                 "category": "Trang phục",   "priority": "urgent", "estimated_cost": 20000000}
 ]'::jsonb,
 '[
   {"name": "Địa điểm & Tiệc",         "allocated_amount": 150000000, "color": "#ef4444"},
   {"name": "Trang phục & Làm đẹp",    "allocated_amount": 50000000,  "color": "#f97316"},
   {"name": "Nhiếp ảnh & Lưu niệm",    "allocated_amount": 30000000,  "color": "#eab308"},
   {"name": "Trang trí & Hoa",         "allocated_amount": 20000000,  "color": "#22c55e"},
   {"name": "Giải trí",                "allocated_amount": 15000000,  "color": "#3b82f6"},
   {"name": "Khách mời & Quà",         "allocated_amount": 20000000,  "color": "#8b5cf6"},
   {"name": "Khác",                    "allocated_amount": 15000000,  "color": "#6b7280"}
 ]'::jsonb,
 TRUE),

-- House Purchase Template
('Mua nhà - Quy trình đầy đủ', 'house',
 'Template cho quá trình tìm kiếm và mua nhà với các bước chi tiết',
 '[
   {"title": "Xác định ngân sách và khả năng tài chính", "category": "Tài chính",  "priority": "urgent"},
   {"title": "Nghiên cứu khu vực muốn mua",              "category": "Tìm kiếm",   "priority": "high"},
   {"title": "Liên hệ ngân hàng về vay mua nhà",         "category": "Tài chính",  "priority": "high"},
   {"title": "Chuẩn bị hồ sơ vay vốn",                  "category": "Tài chính",  "priority": "high"},
   {"title": "Tìm môi giới bất động sản",                "category": "Tìm kiếm",   "priority": "medium"},
   {"title": "Xem nhà và so sánh các lựa chọn",          "category": "Tìm kiếm",   "priority": "high"},
   {"title": "Kiểm tra pháp lý bất động sản",            "category": "Pháp lý",    "priority": "urgent"},
   {"title": "Đàm phán giá",                             "category": "Giao dịch",  "priority": "high"},
   {"title": "Đặt cọc",                                  "category": "Giao dịch",  "priority": "urgent", "estimated_cost": 100000000},
   {"title": "Ký hợp đồng mua bán",                     "category": "Pháp lý",    "priority": "urgent"},
   {"title": "Hoàn tất thủ tục vay",                    "category": "Tài chính",  "priority": "high"},
   {"title": "Thanh toán và nhận nhà",                   "category": "Giao dịch",  "priority": "urgent"},
   {"title": "Sang tên sổ đỏ",                          "category": "Pháp lý",    "priority": "high",   "estimated_cost": 50000000},
   {"title": "Sửa chữa/cải tạo (nếu cần)",              "category": "Cải tạo",    "priority": "medium", "estimated_cost": 100000000},
   {"title": "Mua sắm nội thất",                        "category": "Nội thất",   "priority": "medium", "estimated_cost": 150000000},
   {"title": "Chuyển nhà",                              "category": "Chuyển nhà", "priority": "medium", "estimated_cost": 10000000}
 ]'::jsonb,
 '[
   {"name": "Giá nhà",              "allocated_amount": 3000000000, "color": "#ef4444"},
   {"name": "Đặt cọc",              "allocated_amount": 300000000,  "color": "#f97316"},
   {"name": "Phí pháp lý & Thuế",   "allocated_amount": 100000000,  "color": "#eab308"},
   {"name": "Sửa chữa & Cải tạo",   "allocated_amount": 200000000,  "color": "#22c55e"},
   {"name": "Nội thất",             "allocated_amount": 200000000,  "color": "#3b82f6"},
   {"name": "Phí môi giới",         "allocated_amount": 50000000,   "color": "#8b5cf6"},
   {"name": "Khác",                 "allocated_amount": 50000000,   "color": "#6b7280"}
 ]'::jsonb,
 TRUE),

-- Travel Template
('Du lịch - Kế hoạch chi tiết', 'travel',
 'Template lập kế hoạch chuyến du lịch hoàn hảo',
 '[
   {"title": "Chọn điểm đến và thời gian",          "category": "Lên kế hoạch", "priority": "urgent"},
   {"title": "Nghiên cứu điểm đến",                 "category": "Lên kế hoạch", "priority": "high"},
   {"title": "Đặt vé máy bay/tàu xe",               "category": "Di chuyển",    "priority": "urgent", "estimated_cost": 10000000},
   {"title": "Đặt khách sạn/chỗ ở",                 "category": "Chỗ ở",        "priority": "urgent", "estimated_cost": 8000000},
   {"title": "Làm visa (nếu cần)",                  "category": "Giấy tờ",      "priority": "urgent", "estimated_cost": 2000000},
   {"title": "Mua bảo hiểm du lịch",                "category": "Giấy tờ",      "priority": "high",   "estimated_cost": 500000},
   {"title": "Lập lịch trình chi tiết",             "category": "Lên kế hoạch", "priority": "high"},
   {"title": "Đặt tour/hoạt động",                  "category": "Hoạt động",    "priority": "medium", "estimated_cost": 5000000},
   {"title": "Chuẩn bị hành lý",                   "category": "Chuẩn bị",     "priority": "medium"},
   {"title": "Đổi tiền/mang thẻ quốc tế",           "category": "Tài chính",    "priority": "high"},
   {"title": "Thông báo ngân hàng về chuyến đi",    "category": "Tài chính",    "priority": "medium"},
   {"title": "Sạc pin thiết bị điện tử",            "category": "Chuẩn bị",     "priority": "low"},
   {"title": "In vé và giấy tờ quan trọng",         "category": "Giấy tờ",      "priority": "medium"},
   {"title": "Cài app bản đồ offline",              "category": "Chuẩn bị",     "priority": "low"}
 ]'::jsonb,
 '[
   {"name": "Vé máy bay/Di chuyển", "allocated_amount": 15000000, "color": "#ef4444"},
   {"name": "Chỗ ở",               "allocated_amount": 10000000, "color": "#f97316"},
   {"name": "Ăn uống",             "allocated_amount": 5000000,  "color": "#eab308"},
   {"name": "Hoạt động & Tour",     "allocated_amount": 8000000,  "color": "#22c55e"},
   {"name": "Mua sắm",             "allocated_amount": 5000000,  "color": "#3b82f6"},
   {"name": "Visa & Bảo hiểm",     "allocated_amount": 3000000,  "color": "#8b5cf6"},
   {"name": "Dự phòng",            "allocated_amount": 4000000,  "color": "#6b7280"}
 ]'::jsonb,
 TRUE),

-- Event Template
('Sự kiện - Tổ chức chuyên nghiệp', 'event',
 'Template tổ chức sự kiện từ A đến Z',
 '[
   {"title": "Xác định mục tiêu và quy mô sự kiện", "category": "Lên kế hoạch", "priority": "urgent"},
   {"title": "Lập ngân sách chi tiết",              "category": "Tài chính",    "priority": "urgent"},
   {"title": "Chọn ngày và địa điểm",               "category": "Địa điểm",     "priority": "urgent"},
   {"title": "Đặt địa điểm",                        "category": "Địa điểm",     "priority": "high",   "estimated_cost": 20000000},
   {"title": "Lập danh sách khách mời",              "category": "Khách mời",    "priority": "high"},
   {"title": "Thiết kế chương trình",               "category": "Nội dung",     "priority": "high"},
   {"title": "Mời diễn giả/nghệ sĩ",               "category": "Nội dung",     "priority": "high",   "estimated_cost": 15000000},
   {"title": "Thiết kế và in ấn tài liệu",          "category": "Marketing",    "priority": "medium", "estimated_cost": 3000000},
   {"title": "Đặt catering/đồ ăn",                 "category": "F&B",          "priority": "high",   "estimated_cost": 10000000},
   {"title": "Thuê âm thanh ánh sáng",              "category": "Kỹ thuật",     "priority": "high",   "estimated_cost": 8000000},
   {"title": "Trang trí sự kiện",                   "category": "Trang trí",    "priority": "medium", "estimated_cost": 5000000},
   {"title": "Gửi thư mời",                         "category": "Khách mời",    "priority": "high"},
   {"title": "Theo dõi đăng ký",                    "category": "Khách mời",    "priority": "medium"},
   {"title": "Họp tổng duyệt",                      "category": "Lên kế hoạch", "priority": "high"},
   {"title": "Setup ngày sự kiện",                  "category": "Kỹ thuật",     "priority": "urgent"},
   {"title": "Chụp ảnh/quay phim sự kiện",          "category": "Marketing",    "priority": "medium", "estimated_cost": 5000000}
 ]'::jsonb,
 '[
   {"name": "Địa điểm",              "allocated_amount": 25000000, "color": "#ef4444"},
   {"name": "F&B (Ăn uống)",         "allocated_amount": 15000000, "color": "#f97316"},
   {"name": "Kỹ thuật & Âm thanh",   "allocated_amount": 10000000, "color": "#eab308"},
   {"name": "Diễn giả & Nghệ sĩ",    "allocated_amount": 20000000, "color": "#22c55e"},
   {"name": "Trang trí",             "allocated_amount": 8000000,  "color": "#3b82f6"},
   {"name": "Marketing & In ấn",     "allocated_amount": 5000000,  "color": "#8b5cf6"},
   {"name": "Dự phòng",              "allocated_amount": 7000000,  "color": "#6b7280"}
 ]'::jsonb,
 TRUE)

ON CONFLICT DO NOTHING;


-- ============================================================
-- DONE. Database is ready to use.
-- ============================================================
