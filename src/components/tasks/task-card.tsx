"use client";

import type { Task } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar,
  MoreVertical,
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";

const priorityConfig = {
  low: { label: "Thấp", variant: "secondary" as const },
  medium: { label: "Trung bình", variant: "default" as const },
  high: { label: "Cao", variant: "warning" as const },
  urgent: { label: "Khẩn cấp", variant: "destructive" as const },
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
  onView?: (task: Task) => void;
  draggable?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, onView, draggable }: TaskCardProps) {
  const priority = priorityConfig[task.priority];

  return (
    <div
      className="group rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(task)}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0 mt-1" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(task); }}>
                  <Pencil className="mr-2 h-3 w-3" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(task.id); }}
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant={priority.variant} className="text-xs">
              {priority.label}
            </Badge>

            {task.category && (
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            )}

            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), "dd/MM", { locale: vi })}
              </div>
            )}

            {(task.estimated_cost > 0 || task.actual_cost > 0) && (
              <span className="text-xs text-muted-foreground">
                {formatCurrency(task.actual_cost || task.estimated_cost)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
