"use client";

import type { Task } from "@/types/database";
import { CommentList } from "@/components/comments/comment-list";
import { AttachmentList } from "@/components/attachments/attachment-list";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Tag,
  Wallet,
  MessageSquare,
  Paperclip,
} from "lucide-react";

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels = {
  todo: { label: "Cần làm", variant: "secondary" as const },
  in_progress: { label: "Đang làm", variant: "default" as const },
  done: { label: "Hoàn thành", variant: "outline" as const },
};

const priorityLabels = {
  low: { label: "Thấp", color: "text-gray-500" },
  medium: { label: "Trung bình", color: "text-blue-500" },
  high: { label: "Cao", color: "text-orange-500" },
  urgent: { label: "Khẩn cấp", color: "text-red-500" },
};

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: TaskDetailDialogProps) {
  if (!task) return null;

  const statusConfig = statusLabels[task.status];
  const priorityConfig = priorityLabels[task.priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            <span className={`text-sm ${priorityConfig.color}`}>
              {priorityConfig.label}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="space-y-3">
            {task.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {task.category && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span>{task.category}</span>
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Hạn: {formatDate(task.due_date)}</span>
                </div>
              )}
              {task.start_date && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Bắt đầu: {formatDate(task.start_date)}</span>
                </div>
              )}
              {(task.estimated_cost > 0 || task.actual_cost > 0) && (
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {formatCurrency(task.actual_cost)} / {formatCurrency(task.estimated_cost)}
                  </span>
                </div>
              )}
            </div>

            {task.notes && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Ghi chú</p>
                <p className="text-sm whitespace-pre-wrap">{task.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tabs for Comments & Attachments */}
          <Tabs defaultValue="comments">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Bình luận
              </TabsTrigger>
              <TabsTrigger value="attachments" className="gap-2">
                <Paperclip className="h-4 w-4" />
                Tệp đính kèm
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
              <CommentList taskId={task.id} />
            </TabsContent>
            <TabsContent value="attachments" className="mt-4">
              <AttachmentList taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
