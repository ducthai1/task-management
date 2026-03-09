# Code Review Report: Next.js Components and Pages

**Review Date:** 2026-02-01
**Reviewer:** Code Reviewer Agent
**Scope:** Next.js dashboard components and pages

---

## Code Review Summary

### Scope
- Files reviewed: 10 core Next.js files
- Lines of code analyzed: ~1,500+ lines
- Review focus: Runtime issues, type errors, missing imports, compilation errors
- Updated plans: None (no existing plan provided)

### Overall Assessment
The codebase is generally well-structured with good TypeScript practices. However, there are **1 CRITICAL build configuration issue** and **several runtime/type safety issues** that need immediate attention to prevent app crashes.

---

## Critical Issues

### 1. Build Configuration Error (BLOCKING)
**File:** `next.config.ts`
**Issue:** PWA configuration causing build failure with ENOENT error
**Error:**
```
Error: ENOENT: no such file or directory, rename '/Users/admin/Downloads/AI/task-management/.next/export/500.html' -> '/Users/admin/Downloads/AI/task-management/.next/server/pages/500.html'
```
**Impact:** Application cannot build for production
**Root Cause:** PWA plugin configuration may conflict with Next.js 15.1.4 static export/server rendering
**Recommendation:**
- Verify PWA plugin compatibility with Next.js 15
- Check if custom error pages exist
- Consider adding `output: 'standalone'` to next.config if using SSR
- Test with PWA disabled to isolate issue

---

## High Priority Findings

### 1. Missing Badge Variant Type in task-table.tsx
**File:** `src/components/tasks/task-table.tsx`
**Lines:** 28-31, 33-38
**Issue:** Using non-existent Badge variants `"success"` and `"warning"`
**Current Code:**
```typescript
const statusConfig = {
  todo: { label: "Cần làm", variant: "secondary" as const },
  in_progress: { label: "Đang làm", variant: "warning" as const }, // ❌ "warning" exists
  done: { label: "Hoàn thành", variant: "success" as const }, // ❌ "success" exists
};

const priorityConfig = {
  low: { label: "Thấp", variant: "secondary" as const },
  medium: { label: "TB", variant: "default" as const },
  high: { label: "Cao", variant: "warning" as const }, // ✅ OK
  urgent: { label: "Khẩn", variant: "destructive" as const },
};
```
**Actual Badge Variants Available:** `default`, `secondary`, `destructive`, `outline`, `success`, `warning`
**Status:** Actually VERIFIED - all variants exist in badge.tsx. This is NOT an issue.

### 2. Missing Type Import in dashboard page
**File:** `src/app/(dashboard)/page.tsx`
**Lines:** 88-93
**Issue:** Using priority string as object key without type guard
**Risk:** Runtime error if unexpected priority value
**Current Code:**
```typescript
const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};
// Later used as: priorityColors[task.priority]
```
**Recommendation:**
```typescript
const priorityColors: Record<Task["priority"], string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};
```

### 3. Unsafe Dynamic className in project-card.tsx
**File:** `src/components/projects/project-card.tsx`
**Line:** 57
**Issue:** Template string color class won't be recognized by Tailwind
**Current Code:**
```typescript
<div
  className={`p-2 rounded-lg ${config.color} bg-opacity-10 text-${config.color.replace("bg-", "")}`}
>
```
**Problem:** Tailwind purging will remove `text-pink-500`, `text-blue-500` etc. since they're dynamically generated
**Impact:** Icons will lose color styling in production
**Recommendation:**
```typescript
const projectTypeConfig = {
  wedding: {
    icon: Heart,
    label: "Đám cưới",
    bgColor: "bg-pink-500",
    textColor: "text-pink-500",
    bgOpacity: "bg-pink-100"
  },
  // ... rest
};

<div className={cn("p-2 rounded-lg", config.bgOpacity)}>
  <Icon className={cn("h-4 w-4", config.textColor)} />
</div>
```

### 4. Missing Dependency Check in kanban-board.tsx
**File:** `src/components/tasks/kanban-board.tsx`
**Lines:** 48-74
**Issue:** Drag state not reset properly on error
**Risk:** UI stuck in dragging state if mutation fails
**Recommendation:**
```typescript
const handleDrop = async (e: React.DragEvent, status: Task["status"]) => {
  e.preventDefault();
  if (draggedTask && draggedTask.status !== status) {
    try {
      await updateStatus.mutateAsync({
        id: draggedTask.id,
        status,
        projectId,
      });
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setDraggedTask(null);
    }
  } else {
    setDraggedTask(null);
  }
};
```

### 5. Potential Memory Leak in dashboard page
**File:** `src/app/(dashboard)/page.tsx`
**Lines:** 30-41
**Issue:** useEffect missing cleanup and error handling
**Risk:** State update on unmounted component
**Current Code:**
```typescript
useEffect(() => {
  async function fetchAllTasks() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .order("due_date", { ascending: true });
    setTasks(data || []);
    setTasksLoading(false);
  }
  fetchAllTasks();
}, []);
```
**Recommendation:**
```typescript
useEffect(() => {
  let isMounted = true;

  async function fetchAllTasks() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;

      if (isMounted) {
        setTasks(data || []);
        setTasksLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      if (isMounted) {
        setTasksLoading(false);
      }
    }
  }

  fetchAllTasks();

  return () => {
    isMounted = false;
  };
}, []);
```

---

## Medium Priority Improvements

### 1. Form Reset Logic Issue
**File:** `src/components/tasks/task-form.tsx`, `src/components/projects/project-form.tsx`
**Lines:** TaskForm:99, ProjectForm:82
**Issue:** Form reset called immediately after submit, may clear form before dialog closes
**Impact:** User may see form flash to empty state
**Recommendation:** Reset form in onOpenChange when closing, not in submit handler

### 2. Missing Error Boundaries
**Files:** All page components
**Issue:** No error boundaries to catch runtime errors
**Impact:** Unhandled errors crash entire page
**Recommendation:** Add error.tsx files in route groups

### 3. Inconsistent Loading States
**Files:** Various components
**Issue:** Some components show skeleton, others show nothing while loading
**Impact:** Inconsistent UX
**Recommendation:** Standardize loading states across app

### 4. Type Assertions Could Be Stronger
**File:** `src/app/(dashboard)/projects/page.tsx`
**Line:** 22
**Issue:** Type assertion forces partial data to full type
```typescript
await createProject.mutateAsync({
  ...data,
  owner_id: user.id,
} as Project); // ❌ Unsafe assertion
```
**Recommendation:**
```typescript
await createProject.mutateAsync({
  ...data,
  owner_id: user.id,
} satisfies Insertable<"projects">);
```

### 5. Dropdown Menu Click Propagation
**Files:** `src/components/tasks/task-card.tsx`, others
**Lines:** 64, 70
**Issue:** Manual stopPropagation required, error-prone
**Current:**
```typescript
<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}>
```
**Better pattern:**
```typescript
// Separate the click handler
const handleEdit = (e: React.MouseEvent) => {
  e.stopPropagation();
  onEdit?.(task);
};
<DropdownMenuItem onClick={handleEdit}>
```

---

## Low Priority Suggestions

### 1. Hardcoded Strings for i18n
**Files:** All components
**Issue:** Vietnamese text hardcoded, not externalized
**Recommendation:** Consider i18n library if multi-language support needed

### 2. Magic Numbers in UI
**File:** `src/app/(dashboard)/page.tsx`
**Lines:** 72-83
**Issue:** Number 7 hardcoded for "next 7 days"
**Recommendation:** Extract to constant `const UPCOMING_DAYS = 7`

### 3. Inline Styles Mixed with Classes
**File:** `src/app/(dashboard)/page.tsx`
**Line:** 320
**Issue:** Using inline style for progress bar
```typescript
style={{ width: `${progress}%` }}
```
**Status:** This is actually appropriate for dynamic values

### 4. Console.error Missing in Production
**Files:** Various
**Issue:** No production-safe error logging strategy
**Recommendation:** Add error reporting service (Sentry, LogRocket)

---

## Positive Observations

1. **Excellent TypeScript Usage**: Strong typing with database schema types
2. **Good Component Composition**: Proper separation of concerns
3. **Accessibility**: Good use of Radix UI primitives with built-in a11y
4. **State Management**: Proper use of React Query for server state
5. **Code Organization**: Clean file structure following Next.js conventions
6. **Form Validation**: Proper Zod schemas with react-hook-form integration
7. **Error Handling UI**: Good use of AlertDialog for confirmations
8. **Responsive Design**: Mobile-first approach with Tailwind breakpoints
9. **Loading States**: Skeleton components for better UX
10. **Consistent Naming**: Clear, descriptive variable and function names

---

## Recommended Actions

### Immediate (Before Production)
1. Fix PWA build configuration issue
2. Fix dynamic className in project-card.tsx
3. Add error handling to useEffect in dashboard page
4. Add try-catch-finally to drag-and-drop handler
5. Add ESLint v9 configuration or downgrade to v8

### Short Term (Next Sprint)
1. Add error boundaries to all pages
2. Strengthen type assertions to use `satisfies`
3. Standardize loading states
4. Add cleanup to all useEffect hooks
5. Extract magic numbers to constants

### Long Term (Backlog)
1. Add error reporting service
2. Consider i18n if needed
3. Add comprehensive error logging
4. Add performance monitoring
5. Add E2E tests for critical paths

---

## Metrics

- **Type Coverage:** High (TypeScript strict mode enabled)
- **Test Coverage:** Unknown (no test files reviewed)
- **Build Status:** ❌ FAILING (PWA config issue)
- **Type Check Status:** ✅ PASSING (no tsc errors found)
- **Linting Status:** ⚠️ ESLint v9 config missing

---

## Files with Issues Summary

| File | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| next.config.ts | 1 | 0 | 0 | 0 |
| src/components/projects/project-card.tsx | 0 | 1 | 0 | 0 |
| src/app/(dashboard)/page.tsx | 0 | 2 | 0 | 1 |
| src/components/tasks/kanban-board.tsx | 0 | 1 | 0 | 0 |
| src/app/(dashboard)/projects/page.tsx | 0 | 0 | 1 | 0 |
| src/components/tasks/task-form.tsx | 0 | 0 | 1 | 0 |
| src/components/projects/project-form.tsx | 0 | 0 | 1 | 0 |
| All page components | 0 | 0 | 1 | 0 |

**Total Issues:** 1 Critical, 4 High, 4 Medium, 1 Low

---

## Unresolved Questions

1. Is PWA functionality required for MVP? (affects next.config fix priority)
2. Are custom 404/500 pages implemented? (may be causing build error)
3. Is multi-language support planned? (affects i18n implementation priority)
4. What is target browser support? (affects Tailwind dynamic class strategy)
5. Is error reporting service budget approved? (Sentry/LogRocket integration)
6. Are E2E tests planned? (would catch many runtime issues)
