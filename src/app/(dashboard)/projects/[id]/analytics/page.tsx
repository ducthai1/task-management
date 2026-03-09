"use client";

import { use, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useBudgetCategories } from "@/hooks/use-budget";
import { useGuestStats } from "@/hooks/use-guests";
import { ProgressCard } from "@/components/analytics/progress-card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load heavy chart components
const BudgetPieChart = dynamic(
  () => import("@/components/analytics/budget-pie-chart").then((mod) => mod.BudgetPieChart),
  { loading: () => <Skeleton className="h-[350px]" />, ssr: false }
);

const BudgetBarChart = dynamic(
  () => import("@/components/analytics/budget-bar-chart").then((mod) => mod.BudgetBarChart),
  { loading: () => <Skeleton className="h-[350px]" />, ssr: false }
);
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Wallet,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const { data: categories, isLoading: categoriesLoading } = useBudgetCategories(projectId);
  const guestStats = useGuestStats(projectId);

  // Task stats
  const taskStats = useMemo(() => {
    if (!tasks) return { total: 0, done: 0, inProgress: 0 };
    return {
      total: tasks.length,
      done: tasks.filter((t) => t.status === "done").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
    };
  }, [tasks]);

  // Budget analytics
  const budgetData = useMemo(() => {
    if (!tasks || !categories) return { pieData: [], barData: [], totals: { estimated: 0, actual: 0, allocated: 0 } };

    const totalAllocated = categories.reduce((sum, c) => sum + c.allocated_amount, 0);
    const totalEstimated = tasks.reduce((sum, t) => sum + t.estimated_cost, 0);
    const totalActual = tasks.reduce((sum, t) => sum + t.actual_cost, 0);

    // Spending by category for pie chart
    const spendingByCategory = new Map<string, number>();
    tasks.forEach((task) => {
      const cat = task.category || "Khác";
      spendingByCategory.set(cat, (spendingByCategory.get(cat) || 0) + task.actual_cost);
    });

    const pieData = Array.from(spendingByCategory.entries())
      .map(([name, value]) => {
        const category = categories.find((c) => c.name === name);
        return { name, value, color: category?.color || undefined };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // Estimated vs Actual by category for bar chart
    const barData = categories.map((cat) => {
      const catTasks = tasks.filter((t) => t.category === cat.name);
      return {
        name: cat.name,
        estimated: catTasks.reduce((sum, t) => sum + t.estimated_cost, 0),
        actual: catTasks.reduce((sum, t) => sum + t.actual_cost, 0),
      };
    }).filter((d) => d.estimated > 0 || d.actual > 0);

    return {
      pieData,
      barData,
      totals: { estimated: totalEstimated, actual: totalActual, allocated: totalAllocated },
    };
  }, [tasks, categories]);

  const isLoading = projectLoading || tasksLoading || categoriesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[350px]" />
          <Skeleton className="h-[350px]" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  const budgetUsagePercent = budgetData.totals.allocated > 0
    ? Math.round((budgetData.totals.actual / budgetData.totals.allocated) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Thống kê - {project.name}</h1>
          <p className="text-muted-foreground">
            Tổng quan tiến độ và ngân sách dự án
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <ProgressCard
          title="Tiến độ công việc"
          current={taskStats.done}
          total={taskStats.total}
          unit="tasks"
          variant={
            taskStats.done === taskStats.total && taskStats.total > 0
              ? "success"
              : "default"
          }
          icon={<CheckCircle2 className="h-4 w-4" />}
        />

        <ProgressCard
          title="Ngân sách đã dùng"
          current={budgetData.totals.actual}
          total={budgetData.totals.allocated}
          variant={
            budgetUsagePercent > 100
              ? "danger"
              : budgetUsagePercent > 80
              ? "warning"
              : "default"
          }
          icon={<Wallet className="h-4 w-4" />}
        />

        <ProgressCard
          title="Khách đã check-in"
          current={guestStats.checkedIn}
          total={guestStats.total}
          unit="khách"
          icon={<Users className="h-4 w-4" />}
        />

        <ProgressCard
          title="RSVP đã xác nhận"
          current={guestStats.confirmed}
          total={guestStats.total}
          unit="khách"
          variant={
            guestStats.confirmed === guestStats.total && guestStats.total > 0
              ? "success"
              : "default"
          }
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Budget Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ngân sách phân bổ</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(budgetData.totals.allocated)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Dự toán chi phí</p>
          <p className="text-2xl font-bold text-yellow-600">
            {formatCurrency(budgetData.totals.estimated)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Thực chi</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(budgetData.totals.actual)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <BudgetPieChart data={budgetData.pieData} />
        <BudgetBarChart data={budgetData.barData} />
      </div>
    </div>
  );
}
