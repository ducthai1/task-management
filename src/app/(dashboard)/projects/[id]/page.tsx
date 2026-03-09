"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useBudgetCategories } from "@/hooks/use-budget";
import { TemplatePicker } from "@/components/templates/template-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  ListTodo,
  Wallet,
  Calendar,
  ArrowLeft,
  Heart,
  Home,
  Plane,
  PartyPopper,
  FileText,
} from "lucide-react";

const projectTypeConfig = {
  wedding: { icon: Heart, label: "Đám cưới", color: "text-pink-500" },
  house: { icon: Home, label: "Mua nhà", color: "text-blue-500" },
  travel: { icon: Plane, label: "Du lịch", color: "text-green-500" },
  event: { icon: PartyPopper, label: "Sự kiện", color: "text-purple-500" },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: tasks, isLoading: tasksLoading } = useTasks(id);
  const { data: categories, isLoading: categoriesLoading } = useBudgetCategories(id);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  // Only show "not found" after loading completes
  if (!projectLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Quay lại</Link>
        </Button>
      </div>
    );
  }

  const config = project ? projectTypeConfig[project.type] : null;
  const Icon = config?.icon || Heart;

  const todoCount = tasks?.filter((t) => t.status === "todo").length || 0;
  const inProgressCount = tasks?.filter((t) => t.status === "in_progress").length || 0;
  const doneCount = tasks?.filter((t) => t.status === "done").length || 0;
  const totalBudget = categories?.reduce((sum, c) => sum + c.allocated_amount, 0) || 0;
  const totalSpent = tasks?.reduce((sum, t) => sum + t.actual_cost, 0) || 0;

  const isDataLoading = tasksLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      {/* Header - Always render immediately */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {projectLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              <>
                <Icon className={`h-6 w-6 ${config?.color}`} />
                <h1 className="text-2xl font-bold">{project?.name}</h1>
                <Badge variant="outline">{config?.label}</Badge>
              </>
            )}
          </div>
          {!projectLoading && project?.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setTemplatePickerOpen(true)}>
          <FileText className="mr-2 h-4 w-4" />
          Áp dụng Template
        </Button>
      </div>

      {/* Stats Cards - Skeleton only for numbers */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cần làm</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{todoCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang làm</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{inProgressCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{doneCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi tiêu</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isDataLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                <p className="text-xs text-muted-foreground">/ {formatCurrency(totalBudget)}</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs - Always render */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="tasks" asChild>
            <Link href={`/projects/${id}/tasks`}>Tasks</Link>
          </TabsTrigger>
          <TabsTrigger value="calendar" asChild>
            <Link href={`/projects/${id}/calendar`}>Lịch</Link>
          </TabsTrigger>
          <TabsTrigger value="budget" asChild>
            <Link href={`/projects/${id}/budget`}>Ngân sách</Link>
          </TabsTrigger>
          <TabsTrigger value="guests" asChild>
            <Link href={`/projects/${id}/guests`}>Khách mời</Link>
          </TabsTrigger>
          <TabsTrigger value="checkin" asChild>
            <Link href={`/projects/${id}/checkin`}>Check-in</Link>
          </TabsTrigger>
          <TabsTrigger value="analytics" asChild>
            <Link href={`/projects/${id}/analytics`}>Thống kê</Link>
          </TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link href={`/projects/${id}/members`}>Thành viên</Link>
          </TabsTrigger>
          <TabsTrigger value="activity" asChild>
            <Link href={`/projects/${id}/activity`}>Hoạt động</Link>
          </TabsTrigger>
          <TabsTrigger value="export" asChild>
            <Link href={`/projects/${id}/export`}>Xuất PDF</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quick Info */}
      {!projectLoading && (project?.start_date || project?.end_date) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Thời gian
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm">
            {project?.start_date && (
              <div>
                <span className="text-muted-foreground">Bắt đầu:</span>{" "}
                {formatDate(project.start_date)}
              </div>
            )}
            {project?.end_date && (
              <div>
                <span className="text-muted-foreground">Kết thúc:</span>{" "}
                {formatDate(project.end_date)}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Picker */}
      {project && (
        <TemplatePicker
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          projectId={id}
          projectType={project.type}
        />
      )}
    </div>
  );
}
