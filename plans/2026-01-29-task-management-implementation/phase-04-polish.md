# Phase 4: Polish

**Parent Plan:** [plan.md](./plan.md)
**Dependencies:** [Phase 3: Enhanced UX](./phase-03-enhanced-ux.md)
**Docs:** [Brainstorm Report](../reports/brainstorm-2026-01-29-task-management-system.md)

---

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Description | Comments, File attachments, PDF export, Activity log, Performance, i18n |
| Priority | Medium |
| Implementation Status | Complete |
| Review Status | Pending |

---

## Key Insights

1. Comments enable async collaboration
2. Supabase Storage for file attachments (1GB free)
3. @react-pdf/renderer for PDF generation
4. Activity log for audit trail
5. next-intl for i18n (optional)

---

## Requirements

### 4.1 Comments on Tasks
- [x] Comments table + RLS
- [x] Comment list on task detail
- [x] Add comment form
- [x] Edit/Delete own comments
- [x] Realtime updates

### 4.2 File Attachments
- [x] Attachments table + RLS
- [x] Upload to Supabase Storage
- [x] Display attachments list
- [x] Preview images (with zoom/rotate for images, iframe for PDFs)
- [x] Download files
- [x] Delete attachments

### 4.3 PDF Export
- [x] Project summary report
- [x] Guest list export
- [x] Budget report (included in project report)
- [x] Task checklist export (included in project report)

### 4.4 Activity Log
- [x] Activity_logs table
- [x] Track create/update/delete
- [x] Display activity timeline
- [x] Filter by entity type

### 4.5 Performance Optimization
- [x] Image optimization (Next.js Image component)
- [x] Code splitting (dynamic imports for heavy charts)
- [x] Database indexes review (indexes in migrations)
- [x] Caching strategy review (PWA service worker caching)

### 4.6 Multi-language (Optional)
- [ ] next-intl setup
- [ ] Vietnamese (default)
- [ ] English translation
- [ ] Language switcher

---

## Architecture

### Database Schema (Phase 4 additions)

```sql
-- 9. Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  entity_type TEXT NOT NULL, -- 'task', 'guest', 'budget'
  entity_id UUID NOT NULL,
  entity_name TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Push Subscriptions (for Phase 3)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Can read comments if has access to task
CREATE POLICY comments_read_policy ON comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE t.id = comments.task_id
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- Can write comments if editor/owner
CREATE POLICY comments_write_policy ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE t.id = comments.task_id
      AND (p.owner_id = auth.uid() OR (pm.user_id = auth.uid() AND pm.role IN ('owner', 'editor')))
    )
  );

-- Can only edit/delete own comments
CREATE POLICY comments_manage_policy ON comments
  FOR ALL USING (user_id = auth.uid());

-- RLS for Attachments
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY attachments_policy ON attachments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE t.id = attachments.task_id
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- RLS for Activity Logs (read-only for project members)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_policy ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.id = activity_logs.project_id
      AND (p.owner_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- Only system can insert (via triggers or API)
CREATE POLICY activity_logs_insert_policy ON activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_attachments_task ON attachments(task_id);
CREATE INDEX idx_activity_project ON activity_logs(project_id, created_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);
```

### File Structure (Phase 4 additions)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── projects/[id]/
│   │       ├── activity/page.tsx
│   │       └── export/page.tsx
│   └── api/
│       ├── export/
│       │   ├── pdf/route.ts
│       │   └── csv/route.ts
│       └── upload/route.ts
├── components/
│   ├── comments/
│   │   ├── comment-list.tsx
│   │   ├── comment-form.tsx
│   │   └── comment-item.tsx
│   ├── attachments/
│   │   ├── attachment-list.tsx
│   │   ├── upload-button.tsx
│   │   └── file-preview.tsx
│   ├── activity/
│   │   ├── activity-timeline.tsx
│   │   └── activity-item.tsx
│   └── export/
│       └── export-options.tsx
├── lib/
│   ├── pdf.ts
│   ├── activity.ts
│   └── upload.ts
├── hooks/
│   ├── use-comments.ts
│   ├── use-attachments.ts
│   └── use-activity.ts
└── messages/ (i18n)
    ├── vi.json
    └── en.json
```

---

## Implementation Steps

### Step 1: Comments

**Comment list with realtime:**
```tsx
// components/comments/comment-list.tsx
'use client';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function CommentList({ taskId }: { taskId: string }) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data } = await supabase
        .from('comments')
        .select('*, user:profiles(full_name, avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      return data;
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`comments:${taskId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [taskId]);

  return (
    <div className="space-y-4">
      {comments?.map(comment => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
```

### Step 2: File Attachments

**Supabase Storage bucket:**
```sql
-- Run in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);

-- RLS for storage
CREATE POLICY attachments_bucket_policy ON storage.objects
  FOR ALL USING (bucket_id = 'attachments' AND auth.uid() IS NOT NULL);
```

**Upload handler:**
```typescript
// lib/upload.ts
import { createClient } from '@/lib/supabase/client';

export async function uploadFile(file: File, taskId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const filePath = `${user?.id}/${taskId}/${Date.now()}-${file.name}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Create attachment record
  const { data, error } = await supabase.from('attachments').insert({
    task_id: taskId,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user?.id,
  }).select().single();

  return data;
}
```

### Step 3: PDF Export

```bash
npm install @react-pdf/renderer
```

**PDF Generator:**
```tsx
// lib/pdf.ts
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 20 },
  section: { marginBottom: 15 },
  heading: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  text: { fontSize: 10, marginBottom: 3 },
});

interface ProjectData {
  name: string;
  tasks: Array<{ title: string; status: string; due_date?: string }>;
  budget: { total: number; spent: number };
}

export function ProjectReport({ data }: { data: ProjectData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.name}</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>Tasks ({data.tasks.length})</Text>
          {data.tasks.map((task, i) => (
            <Text key={i} style={styles.text}>
              • {task.title} [{task.status}]
              {task.due_date ? ` - Due: ${task.due_date}` : ''}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Budget</Text>
          <Text style={styles.text}>Total: {data.budget.total.toLocaleString()}đ</Text>
          <Text style={styles.text}>Spent: {data.budget.spent.toLocaleString()}đ</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generatePDF(data: ProjectData): Promise<Blob> {
  return await pdf(<ProjectReport data={data} />).toBlob();
}
```

### Step 4: Activity Log

**Activity logger utility:**
```typescript
// lib/activity.ts
import { createClient } from '@/lib/supabase/server';

type Action = 'create' | 'update' | 'delete';
type EntityType = 'task' | 'guest' | 'budget' | 'member';

export async function logActivity({
  projectId,
  action,
  entityType,
  entityId,
  entityName,
  changes,
}: {
  projectId: string;
  action: Action;
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  changes?: Record<string, any>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('activity_logs').insert({
    project_id: projectId,
    user_id: user?.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    changes,
  });
}
```

**Activity timeline component:**
```tsx
// components/activity/activity-timeline.tsx
'use client';

const actionIcons = {
  create: '➕',
  update: '✏️',
  delete: '🗑️',
};

const actionText = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
};

export function ActivityTimeline({ activities }: { activities: Activity[] }) {
  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div key={activity.id} className="flex gap-3 text-sm">
          <span>{actionIcons[activity.action]}</span>
          <div>
            <span className="font-medium">{activity.user?.full_name}</span>
            {' '}{actionText[activity.action]}{' '}
            <span className="font-medium">{activity.entity_type}</span>
            {activity.entity_name && `: "${activity.entity_name}"`}
            <time className="text-muted-foreground ml-2">
              {formatRelative(new Date(activity.created_at), new Date())}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 5: Performance Optimization

**Image optimization:**
```tsx
// Use Next.js Image component everywhere
import Image from 'next/image';

<Image
  src={avatarUrl}
  alt="Avatar"
  width={40}
  height={40}
  className="rounded-full"
/>
```

**Code splitting:**
```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const TaskGantt = dynamic(() => import('@/components/gantt/task-gantt'), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false, // Gantt chart uses window
});

const BudgetPieChart = dynamic(() => import('@/components/analytics/budget-pie-chart'), {
  loading: () => <Skeleton className="h-64" />,
});
```

**Database indexes review:**
```sql
-- Verify indexes exist and are used
EXPLAIN ANALYZE SELECT * FROM tasks WHERE project_id = '...' ORDER BY due_date;
```

### Step 6: Multi-language (Optional)

```bash
npm install next-intl
```

**Setup:**
```tsx
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({ children, params: { locale } }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

**Translation files:**
```json
// messages/vi.json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa"
  },
  "tasks": {
    "title": "Công việc",
    "addTask": "Thêm công việc"
  }
}
```

---

## Todo List

- [x] Run Phase 4 database migrations (supabase/migrations-phase-04.sql)
- [x] Build comments list component (src/components/comments/comment-list.tsx)
- [x] Build comment form with validation (src/components/comments/comment-form.tsx)
- [x] Add realtime updates for comments (src/hooks/use-comments.ts)
- [x] Create Supabase storage bucket (in migration)
- [x] Build file upload component (src/components/attachments/upload-button.tsx)
- [x] Build attachments list (src/components/attachments/attachment-list.tsx)
- [x] Add file preview modal (src/components/attachments/file-preview-dialog.tsx)
- [x] Install @react-pdf/renderer
- [x] Build PDF export templates (src/lib/pdf/project-report.tsx, guest-list-report.tsx)
- [x] Create export page (src/app/(dashboard)/projects/[id]/export/page.tsx)
- [x] Build activity log utility (src/hooks/use-activity.ts)
- [x] Add activity logging to mutations (client-side logging)
- [x] Build activity timeline page (src/app/(dashboard)/projects/[id]/activity/page.tsx)
- [x] Review and add database indexes (in migrations)
- [x] Implement lazy loading for charts (dynamic imports in analytics page)
- [x] Optimize images with next/image
- [ ] (Optional) Setup next-intl
- [ ] (Optional) Create translation files

---

## Success Criteria

- [x] Comments work with realtime updates
- [x] Files upload and download correctly
- [x] PDF exports generate properly
- [x] Activity log tracks all changes
- [x] Performance optimization (code splitting, lazy loading)
- [ ] (Optional) Language switcher works

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Large file uploads fail | Medium | Medium | File size limits, chunked upload |
| PDF generation slow | Low | Low | Generate async, show progress |
| Activity log bloat | Low | Medium | Retention policy, cleanup job |

---

## Security Considerations

- File uploads validated for type/size
- Storage RLS prevents unauthorized access
- Activity logs cannot be modified
- Comments sanitized to prevent XSS

---

## Next Steps

After Phase 4 complete:
1. Full testing across all features
2. Deploy to production
3. Monitor performance metrics
4. Gather user feedback
5. Plan future enhancements
