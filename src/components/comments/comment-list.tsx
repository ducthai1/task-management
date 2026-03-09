"use client";

import { useComments } from "@/hooks/use-comments";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const { data: comments, isLoading } = useComments(taskId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Bình luận ({comments?.length || 0})
      </div>

      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} taskId={taskId} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Chưa có bình luận nào
        </p>
      )}

      <div className="pt-4 border-t">
        <CommentForm taskId={taskId} />
      </div>
    </div>
  );
}
