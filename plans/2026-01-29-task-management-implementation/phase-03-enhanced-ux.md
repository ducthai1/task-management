# Phase 3: Enhanced UX

**Parent Plan:** [plan.md](./plan.md)
**Dependencies:** [Phase 2: Essential Features](./phase-02-essential-features.md)
**Docs:** [PWA Research](./research/researcher-02-pwa-offline-strategies.md)

---

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-01-29 |
| Description | PWA, Offline mode, QR check-in, Gantt chart, Budget analytics, Push notifications |
| Priority | High |
| Implementation Status | Partial (Core features done) |
| Review Status | Passed |

---

## Key Insights

1. Use @ducanh2912/next-pwa (actively maintained for App Router)
2. Dexie.js for IndexedDB (simpler than raw API)
3. Background Sync API for offline mutations
4. VAPID keys required for push notifications
5. QRCode.js for generation, html5-qrcode for scanning

---

## Requirements

### 3.1 PWA Configuration
- [ ] Install @ducanh2912/next-pwa
- [ ] Create manifest.json
- [ ] Add PWA icons (192x192, 512x512)
- [ ] Configure service worker
- [ ] Add install prompt UI

### 3.2 Offline Mode
- [ ] Setup Dexie.js (IndexedDB)
- [ ] Cache critical data locally
- [ ] Offline-first for tasks/guests
- [ ] Sync indicator UI
- [ ] Background sync when online

### 3.3 QR Check-in
- [ ] Generate unique QR per guest
- [ ] QR scanner page
- [ ] Mark guest as checked-in
- [ ] Offline check-in support
- [ ] Check-in stats

### 3.4 Gantt Chart
- [ ] Install gantt-task-react
- [ ] Map tasks to Gantt format
- [ ] Date range picker
- [ ] Task dependencies (optional)

### 3.5 Budget Analytics
- [ ] Install Recharts
- [ ] Pie chart: spending by category
- [ ] Bar chart: estimated vs actual
- [ ] Progress indicators
- [ ] Budget alerts

### 3.6 Push Notifications
- [ ] Generate VAPID keys
- [ ] Push subscription UI
- [ ] Store subscriptions in DB
- [ ] Send deadline reminders
- [ ] Send sync notifications

---

## Architecture

### PWA Configuration

```js
// next.config.js
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOpts: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api",
          expiration: { maxEntries: 100, maxAgeSeconds: 300 }
        }
      },
      {
        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 50, maxAgeSeconds: 86400 * 30 }
        }
      }
    ]
  }
});

module.exports = withPWA({
  reactStrictMode: true
});
```

### IndexedDB Schema (Dexie)

```typescript
// lib/db.ts
import Dexie, { Table } from 'dexie';

export interface OfflineTask {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  syncPending: boolean;
  syncAction: 'create' | 'update' | 'delete';
  lastModified: number;
}

export interface OfflineGuest {
  id: string;
  project_id: string;
  name: string;
  rsvp_status: string;
  checked_in: boolean;
  checked_in_at?: string;
  syncPending: boolean;
  syncAction: 'update';
  lastModified: number;
}

export class TaskManagerDB extends Dexie {
  tasks!: Table<OfflineTask>;
  guests!: Table<OfflineGuest>;

  constructor() {
    super('TaskManagerDB');
    this.version(1).stores({
      tasks: 'id, project_id, syncPending, lastModified',
      guests: 'id, project_id, syncPending, lastModified'
    });
  }
}

export const db = new TaskManagerDB();
```

### File Structure (Phase 3 additions)

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── projects/[id]/
│   │       ├── gantt/page.tsx
│   │       ├── analytics/page.tsx
│   │       └── checkin/page.tsx
│   └── api/
│       ├── push/
│       │   ├── subscribe/route.ts
│       │   └── send/route.ts
│       └── sync/route.ts
├── components/
│   ├── pwa/
│   │   ├── install-prompt.tsx
│   │   ├── offline-indicator.tsx
│   │   └── sync-status.tsx
│   ├── checkin/
│   │   ├── qr-scanner.tsx
│   │   ├── qr-display.tsx
│   │   └── checkin-stats.tsx
│   ├── gantt/
│   │   └── task-gantt.tsx
│   └── analytics/
│       ├── budget-pie-chart.tsx
│       ├── budget-bar-chart.tsx
│       └── progress-card.tsx
├── lib/
│   ├── db.ts (Dexie)
│   ├── push.ts
│   └── sync.ts
├── hooks/
│   ├── use-offline-sync.ts
│   ├── use-online-status.ts
│   └── use-push-notifications.ts
└── public/
    ├── manifest.json
    ├── sw.js (generated)
    ├── icon-192.png
    └── icon-512.png
```

---

## Implementation Steps

### Step 1: PWA Setup

```bash
# Install dependencies
npm install @ducanh2912/next-pwa
```

**manifest.json:**
```json
{
  "name": "Task Manager - Quản lý đám cưới",
  "short_name": "TaskMgr",
  "description": "Offline-first task management for weddings and events",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#0f172a",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Layout metadata:**
```tsx
// app/layout.tsx
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Task Manager',
  },
};
```

### Step 2: Offline Mode with Dexie

```bash
npm install dexie
```

**Offline sync hook:**
```typescript
// hooks/use-offline-sync.ts
import { useEffect, useState } from 'react';
import { db, OfflineTask } from '@/lib/db';
import { useOnlineStatus } from './use-online-status';
import { createClient } from '@/lib/supabase/client';

export function useOfflineSync(projectId: string) {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();
  const supabase = createClient();

  // Count pending items
  useEffect(() => {
    db.tasks.where('syncPending').equals(1).count().then(setPendingCount);
  }, []);

  // Sync when online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingItems();
    }
  }, [isOnline, pendingCount]);

  async function syncPendingItems() {
    setIsSyncing(true);
    const pending = await db.tasks.where('syncPending').equals(1).toArray();

    for (const task of pending) {
      try {
        if (task.syncAction === 'create') {
          await supabase.from('tasks').insert(task);
        } else if (task.syncAction === 'update') {
          await supabase.from('tasks').update(task).eq('id', task.id);
        }
        await db.tasks.update(task.id, { syncPending: false });
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }

    setPendingCount(0);
    setIsSyncing(false);
  }

  return { pendingCount, isSyncing, syncPendingItems };
}
```

### Step 3: QR Check-in

```bash
npm install qrcode html5-qrcode
```

**Generate QR:**
```typescript
// lib/qr.ts
import QRCode from 'qrcode';

export async function generateGuestQR(guestId: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/checkin/${guestId}`;
  return await QRCode.toDataURL(url, { width: 300 });
}
```

**QR Scanner:**
```tsx
// components/checkin/qr-scanner.tsx
'use client';
import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScanner({ onScan }: { onScan: (guestId: string) => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode('qr-reader');

    scannerRef.current.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        const guestId = decodedText.split('/').pop();
        if (guestId) onScan(guestId);
      },
      () => {} // Ignore errors
    );

    return () => {
      scannerRef.current?.stop();
    };
  }, [onScan]);

  return <div id="qr-reader" className="w-full max-w-md mx-auto" />;
}
```

**Offline check-in:**
```typescript
async function checkInGuest(guestId: string) {
  const now = new Date().toISOString();

  // Update local DB first (offline-first)
  await db.guests.update(guestId, {
    checked_in: true,
    checked_in_at: now,
    syncPending: true,
    syncAction: 'update',
    lastModified: Date.now(),
  });

  // Try to sync immediately if online
  if (navigator.onLine) {
    await supabase.from('guests')
      .update({ checked_in: true, checked_in_at: now })
      .eq('id', guestId);

    await db.guests.update(guestId, { syncPending: false });
  }
}
```

### Step 4: Gantt Chart

```bash
npm install gantt-task-react
```

**Gantt component:**
```tsx
// components/gantt/task-gantt.tsx
'use client';
import { Gantt, Task, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

interface Props {
  tasks: Array<{
    id: string;
    title: string;
    start_date: string;
    due_date: string;
    status: string;
  }>;
}

export function TaskGantt({ tasks }: Props) {
  const ganttTasks: Task[] = tasks
    .filter(t => t.start_date && t.due_date)
    .map(t => ({
      id: t.id,
      name: t.title,
      start: new Date(t.start_date),
      end: new Date(t.due_date),
      progress: t.status === 'done' ? 100 : t.status === 'in_progress' ? 50 : 0,
      type: 'task',
    }));

  return (
    <Gantt
      tasks={ganttTasks}
      viewMode={ViewMode.Week}
      listCellWidth=""
      columnWidth={60}
    />
  );
}
```

### Step 5: Budget Analytics

```bash
npm install recharts
```

**Pie Chart:**
```tsx
// components/analytics/budget-pie-chart.tsx
'use client';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface Props {
  data: Array<{ name: string; value: number }>;
}

export function BudgetPieChart({ data }: Props) {
  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label
      >
        {data.map((_, index) => (
          <Cell key={index} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={(value) => `${value.toLocaleString()}đ`} />
      <Legend />
    </PieChart>
  );
}
```

### Step 6: Push Notifications

```bash
npm install web-push
npx web-push generate-vapid-keys
```

**Store keys in .env:**
```
NEXT_PUBLIC_VAPID_PUBLIC=...
VAPID_PRIVATE=...
```

**Subscribe handler:**
```typescript
// app/api/push/subscribe/route.ts
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const subscription = await request.json();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from('push_subscriptions').upsert({
    user_id: user?.id,
    subscription: subscription,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return Response.json({ ok: true });
}
```

---

## Todo List

- [x] Install @ducanh2912/next-pwa
- [x] Create manifest.json with icons
- [x] Configure next.config.ts for PWA
- [x] Install and setup Dexie.js
- [x] Create offline database schema (src/lib/db.ts)
- [x] Build useOfflineSync hook (src/hooks/use-offline-sync.ts)
- [x] Build offline indicator component (src/components/pwa/offline-indicator.tsx)
- [x] Build sync status UI (integrated in header)
- [x] Install qrcode
- [x] Generate QR codes for guests (src/lib/qr.ts)
- [ ] Build QR scanner component (deferred - needs html5-qrcode)
- [x] Implement check-in flow (src/app/(dashboard)/projects/[id]/checkin/page.tsx)
- [x] Build check-in stats page
- [ ] Install gantt-task-react (deferred)
- [ ] Build Gantt chart component (deferred)
- [ ] Add Gantt view to project page (deferred)
- [x] Install Recharts
- [x] Build budget pie chart (src/components/analytics/budget-pie-chart.tsx)
- [x] Build estimated vs actual bar chart (src/components/analytics/budget-bar-chart.tsx)
- [ ] Generate VAPID keys (deferred - requires web-push setup)
- [ ] Build push subscription UI (deferred)
- [ ] Create push_subscriptions table (deferred)
- [ ] Implement deadline reminder logic (deferred)

---

## Success Criteria

- [x] App installable as PWA
- [x] Works offline (view tasks/guests) - via service worker caching
- [x] Offline mutations sync when online - infrastructure ready
- [x] QR check-in flow works (manual check-in)
- [ ] Gantt chart displays correctly (deferred)
- [x] Budget charts render properly
- [ ] Push notifications received (deferred)

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| IndexedDB data loss | High | Low | Regular sync when online |
| Sync conflicts | Medium | Medium | Last-write-wins + timestamp |
| Push not supported (iOS) | Medium | Medium | Fallback to email |

---

## Security Considerations

- QR codes should be unique and unpredictable (UUID)
- Push subscriptions tied to authenticated user
- Offline data encrypted at rest (browser handles)
- Service worker only from same origin

---

## Next Steps

After Phase 3 complete:
1. Proceed to [Phase 4: Polish](./phase-04-polish.md)
2. Add comments feature
3. Add file attachments
4. PDF export
