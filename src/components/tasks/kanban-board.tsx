"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import { useUpdateTaskStatus, useDeleteTask } from "@/hooks/use-tasks";
import { TaskCard } from "./task-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { ListTodo, Clock, CheckCircle2 } from "lucide-react";

const columns = [
  {
    id: "todo" as const,
    title: "Cần làm",
    icon: ListTodo,
    color: "border-t-slate-400",
  },
  {
    id: "in_progress" as const,
    title: "Đang làm",
    icon: Clock,
    color: "border-t-yellow-400",
  },
  {
    id: "done" as const,
    title: "Hoàn thành",
    icon: CheckCircle2,
    color: "border-t-green-400",
  },
];

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
}

export function KanbanBoard({ tasks, projectId, onEditTask, onViewTask }: KanbanBoardProps) {
  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, status: Task["status"]) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      updateStatus.mutate(
        { id: draggedTask.id, status, projectId },
        { onSettled: () => setDraggedTask(null) }
      );
    } else {
      setDraggedTask(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTask.mutateAsync({ id: deleteId, projectId });
    setDeleteId(null);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => {
          const columnTasks = tasks.filter((t) => t.status === column.id);
          const Icon = column.icon;

          return (
            <div
              key={column.id}
              className={cn(
                "flex flex-col rounded-lg border-t-4 bg-muted/30",
                column.color
              )}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center gap-2 p-4 border-b">
                <Icon className="h-4 w-4" />
                <h3 className="font-semibold">{column.title}</h3>
                <span className="ml-auto text-sm text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex-1 p-2 space-y-2 min-h-[200px]">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing",
                      draggedTask?.id === task.id && "opacity-50"
                    )}
                  >
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      onDelete={setDeleteId}
                      onView={onViewTask}
                      draggable
                    />
                  </div>
                ))}
                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                    Kéo thả task vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa task này? Hành động này không thể hoàn
              tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
