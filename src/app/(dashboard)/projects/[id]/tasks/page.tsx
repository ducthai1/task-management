"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useTasks, useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import type { Task } from "@/types/database";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskTable } from "@/components/tasks/task-table";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowLeft, LayoutGrid, List } from "lucide-react";

export default function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [view, setView] = useState<"kanban" | "table">("kanban");

  const handleCreate = async (data: Partial<Task>) => {
    await createTask.mutateAsync({
      ...data,
      project_id: projectId,
    } as Task);
    setFormOpen(false);
  };

  const handleUpdate = async (data: Partial<Task>) => {
    if (!editingTask) return;
    await updateTask.mutateAsync({
      id: editingTask.id,
      ...data,
    });
    setEditingTask(null);
  };

  // Only show "not found" after loading completes
  if (!projectLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Always render immediately */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Tasks - {projectLoading ? <Skeleton className="h-6 w-32 inline-block" /> : project?.name}
          </h1>
          <p className="text-muted-foreground">
            Quản lý các công việc trong dự án
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
            <TabsList>
              <TabsTrigger value="kanban">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="table">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm task
          </Button>
        </div>
      </div>

      {/* Content - Skeleton only for data area */}
      {tasksLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ))}
          </div>
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          tasks={tasks || []}
          projectId={projectId}
          onEditTask={setEditingTask}
          onViewTask={setViewingTask}
        />
      ) : (
        <TaskTable
          tasks={tasks || []}
          projectId={projectId}
          onEditTask={setEditingTask}
          onViewTask={setViewingTask}
        />
      )}

      {/* Create Form */}
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isLoading={createTask.isPending}
      />

      {/* Edit Form */}
      <TaskForm
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSubmit={handleUpdate}
        defaultValues={editingTask || undefined}
        isLoading={updateTask.isPending}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        task={viewingTask}
        open={!!viewingTask}
        onOpenChange={(open) => !open && setViewingTask(null)}
      />
    </div>
  );
}
