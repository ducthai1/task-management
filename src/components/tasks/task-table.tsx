"use client";

import { useState } from "react";
import type { Task } from "@/types/database";
import { useDeleteTask } from "@/hooks/use-tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

const statusConfig = {
  todo: { label: "Cần làm", variant: "secondary" as const },
  in_progress: { label: "Đang làm", variant: "warning" as const },
  done: { label: "Hoàn thành", variant: "success" as const },
};

const priorityConfig = {
  low: { label: "Thấp", variant: "secondary" as const },
  medium: { label: "TB", variant: "default" as const },
  high: { label: "Cao", variant: "warning" as const },
  urgent: { label: "Khẩn", variant: "destructive" as const },
};

interface TaskTableProps {
  tasks: Task[];
  projectId: string;
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
}

export function TaskTable({ tasks, projectId, onEditTask, onViewTask }: TaskTableProps) {
  const deleteTask = useDeleteTask();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTask.mutateAsync({ id: deleteId, projectId });
    setDeleteId(null);
  };

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left text-sm font-medium">
                Tiêu đề
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium">
                Trạng thái
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium">
                Ưu tiên
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium">
                Danh mục
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium">
                Hạn
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium">
                Chi phí
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium w-[50px]">

              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const status = statusConfig[task.status];
              const priority = priorityConfig[task.priority];

              return (
                <tr key={task.id} className="border-b hover:bg-muted/30">
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge variant={priority.variant}>{priority.label}</Badge>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {task.category || "-"}
                  </td>
                  <td className="p-4 text-sm">
                    {task.due_date ? formatDate(task.due_date) : "-"}
                  </td>
                  <td className="p-4 text-sm">
                    {task.actual_cost > 0
                      ? formatCurrency(task.actual_cost)
                      : task.estimated_cost > 0
                      ? formatCurrency(task.estimated_cost)
                      : "-"}
                  </td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewTask?.(task)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTask(task)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(task.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có task nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa task này?
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
