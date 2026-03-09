"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useProjects } from "@/hooks/use-projects";
import { useAllTasks } from "@/hooks/use-tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  Wallet,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useAllTasks();

  // Memoize all computed values
  const stats = useMemo(() => {
    const totalProjects = projects?.length || 0;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalBudget = tasks.reduce((sum, t) => sum + t.estimated_cost, 0);
    const totalSpent = tasks.reduce((sum, t) => sum + t.actual_cost, 0);

    return { totalProjects, totalTasks, completedTasks, totalBudget, totalSpent };
  }, [projects?.length, tasks]);

  const overdueTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
    );
  }, [tasks]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return tasks
      .filter(
        (t) =>
          t.due_date &&
          new Date(t.due_date) >= today &&
          new Date(t.due_date) <= nextWeek &&
          t.status !== "done"
      )
      .slice(0, 5);
  }, [tasks]);

  const recentProjects = useMemo(() => projects?.slice(0, 3) || [], [projects]);

  // Loading state
  if (projectsLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-muted-foreground">
            Chào mừng trở lại! Đây là tổng quan các dự án của bạn.
          </p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            Dự án mới
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự án</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Đang quản lý</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công việc</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.completedTasks}/{stats.totalTasks}
            </div>
            <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueTasks.length > 0 ? "text-red-600" : ""}`}>
              {overdueTasks.length}
            </div>
            <p className="text-xs text-muted-foreground">Cần xử lý ngay</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ngân sách</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              / {formatCurrency(stats.totalBudget)} dự kiến
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sắp tới
            </CardTitle>
            <span className="text-sm text-muted-foreground">7 ngày tới</span>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Không có công việc nào sắp đến hạn
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {task.due_date && formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${task.project_id}/tasks`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Quá hạn
            </CardTitle>
            <span className="text-sm text-muted-foreground">{overdueTasks.length} công việc</span>
          </CardHeader>
          <CardContent>
            {overdueTasks.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Tuyệt vời! Không có công việc quá hạn
              </p>
            ) : (
              <div className="space-y-3">
                {overdueTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <span className="text-xs text-red-600">
                        Quá hạn: {task.due_date && formatDate(task.due_date)}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${task.project_id}/tasks`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dự án gần đây</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              Xem tất cả
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Chưa có dự án nào</p>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo dự án đầu tiên
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {recentProjects.map((project) => {
                const projectTasks = tasks.filter((t) => t.project_id === project.id);
                const done = projectTasks.filter((t) => t.status === "done").length;
                const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block p-4 rounded-lg border hover:border-primary transition-colors"
                  >
                    <h3 className="font-medium mb-2">{project.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Badge variant="outline">{project.type}</Badge>
                      <span>
                        {done}/{projectTasks.length} công việc
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Tạo dự án
              </Link>
            </Button>
            {recentProjects[0] && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/projects/${recentProjects[0].id}/tasks`}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Quản lý công việc
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/projects/${recentProjects[0].id}/calendar`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Xem lịch
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/projects/${recentProjects[0].id}/budget`}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Ngân sách
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
