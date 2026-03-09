"use client";

import { use, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import type { Task } from "@/types/database";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

// Lazy load react-big-calendar (~250KB) — only loaded when calendar page visited
const TaskCalendar = dynamic(
  () => import("@/components/calendar/task-calendar").then((mod) => mod.TaskCalendar),
  { loading: () => <Skeleton className="h-[600px]" />, ssr: false }
);

export default function CalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const updateTask = useUpdateTask();

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleUpdate = async (data: Partial<Task>) => {
    if (!editingTask) return;
    await updateTask.mutateAsync({
      id: editingTask.id,
      ...data,
    });
    setEditingTask(null);
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px]" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Lịch - {project.name}</h1>
          <p className="text-muted-foreground">
            Xem timeline các công việc theo lịch
          </p>
        </div>
      </div>

      {/* Calendar */}
      <TaskCalendar tasks={tasks || []} onSelectTask={setEditingTask} />

      {/* Edit Task Dialog */}
      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleUpdate}
        defaultValues={editingTask || undefined}
        isLoading={updateTask.isPending}
      />
    </div>
  );
}
