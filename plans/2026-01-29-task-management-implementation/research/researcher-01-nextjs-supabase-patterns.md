# Next.js 14 App Router + Supabase Integration Patterns (2025-2026)

## Executive Summary

Production-ready patterns established for Next.js 14 App Router with Supabase. Migration from `@supabase/auth-helpers` to `@supabase/ssr` is standard. Cookie-based SSR auth is mature and recommended. Multi-tenant RLS via organizations/tenant_id is foundational SaaS pattern.

---

## 1. SSR Client Setup with @supabase/ssr

**Why:** Replaces deprecated `@supabase/auth-helpers`. Handles token refresh via middleware and cookie management for secure sessions.

**Installation:**
```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Server Client** (lib/supabase/server.ts):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

**Client Component** (lib/supabase/client.ts):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Middleware** (middleware.ts) - Token refresh pattern:
```typescript
import { updateSession } from '@supabase/auth-helpers-nextjs'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

**Critical:** Without middleware refresh, auth tokens expire and app behaves unexpectedly.

---

## 2. Row-Level Security for Multi-Tenant Apps

**Principle:** Defense-in-depth. RLS enforced at database level, never trust application logic alone.

**Standard Pattern** - Organization-based tenant isolation:

```sql
-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their organization's tasks
CREATE POLICY org_isolation_policy ON tasks
  USING (
    EXISTS (
      SELECT 1 FROM user_org_membership
      WHERE user_org_membership.user_id = auth.uid()
      AND user_org_membership.org_id = tasks.org_id
    )
  );

-- Composite index for performance (critical!)
CREATE INDEX idx_tasks_org_user
  ON tasks(org_id, user_id)
  INCLUDE (created_at);
```

**Common Mistakes:** Forgetting RLS enable, writing overly broad policies, missing indexes causing full table scans. **Performance:** Every query filtering by `tenant_id` + sort requires composite index.

---

## 3. TanStack Query + Supabase Integration

**Pattern:** Use TanStack Query v5+ for client state, `@supabase/supabase-cache-helpers` for QueryKey generation.

**Setup:**
```typescript
// app/providers.tsx - QueryClientProvider wrapper
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

**Client Component Query:**
```typescript
'use client'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function TaskList() {
  const supabase = createClient()
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })
      return data
    },
  })
  return <div>{tasks?.map(t => <div key={t.id}>{t.title}</div>)}</div>
}
```

**Server Component Pattern:** Fetch in server first, pass as prop (eliminates loading states, better UX for SaaS dashboards).

---

## 4. Authentication Flow (Google OAuth + Email/Password)

**Email/Password - Signup:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePass123',
  options: {
    emailRedirectTo: `${origin}/auth/callback`,
  },
})
```

**Email/Password - Login:**
```typescript
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'SecurePass123',
})
```

**Google OAuth Setup:**
1. Create OAuth client in Google Cloud Console
2. Add authorized origins: `http://localhost:3000` (dev), production URL
3. Add callback URIs to Google and Supabase dashboard
4. Use in Next.js:

```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${origin}/auth/callback`,
  },
})
```

**Callback Handler** (app/auth/callback/route.ts):
```typescript
export async function GET(request: NextRequest) {
  const code = searchParams.get('code')
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

---

## 5. Realtime Subscriptions Patterns

**Channel Subscription** - React to INSERT/UPDATE/DELETE:
```typescript
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function TasksRealtime({ orgId }) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`tasks:org:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'tasks',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          console.log('Change:', payload.eventType, payload.new)
          // Update local state/cache
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [orgId])
}
```

**Presence Detection:**
```typescript
const channel = supabase.channel(`document:${docId}`, {
  config: { presence: { key: userId } }
})

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  setOnlineUsers(Object.keys(state).length)
})
```

**Best Practices:** Verify RLS policies allow subscription, implement graceful reconnection, show offline indicators.

---

## Key Takeaways

- **@supabase/ssr** is stable, replaces auth-helpers entirely
- **Middleware token refresh** is mandatory for SSR apps
- **Composite indexes** essential for multi-tenant RLS queries
- **Server Components first:** Fetch in server, pass data to clients (reduces hydration mismatches)
- **TanStack Query** handles caching/refetch; pair with Server Components
- **OAuth callback route** must be server-side route handler
- **RLS policies** first line of defense; application logic is secondary
- **Realtime needs unsubscribe cleanup** to prevent memory leaks

---

## Unresolved Questions

- Best practices for handling offline-first PWA sync with Supabase Realtime?
- Cost implications of high-frequency Realtime subscriptions at scale?
- Recommended patterns for PostgreSQL advisory locks in multi-tenant contexts?

---

## Sources

- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js App Router + Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Row Level Security in Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Multi-Tenant RLS Patterns](https://www.antstack.com/blog/multi-tenant-applications-with-rls-on-supabase-postgress/)
- [TanStack Query + Supabase Integration](https://supabase.com/blog/react-query-nextjs-app-router-cache-helpers)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase Realtime with Next.js](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Cookie-Based Auth 2025 Best Practices](https://the-shubham.medium.com/next-js-supabase-cookie-based-auth-workflow-the-best-auth-solution-2025-guide-f6738b4673c1)
- [SaaS Architecture Patterns](https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs)
