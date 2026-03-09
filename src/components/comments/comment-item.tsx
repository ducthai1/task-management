"use client";

import { useState } from "react";
import type { Comment } from "@/types/database";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateComment, useDeleteComment } from "@/hooks/use-comments";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface CommentItemProps {
  comment: Comment;
  taskId: string;
}

export function CommentItem({ comment, taskId }: CommentItemProps) {
  const { user } = useAuth();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = user?.id === comment.user_id;
  const displayName = comment.user?.full_name || "User";
  const initials = displayName.charAt(0).toUpperCase();

  const handleUpdate = () => {
    if (!editContent.trim()) return;
    updateComment.mutate(
      { id: comment.id, taskId, content: editContent },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Bạn có chắc muốn xóa bình luận này?")) {
      deleteComment.mutate({ id: comment.id, taskId });
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={comment.user?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: vi,
            })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-xs text-muted-foreground">(đã sửa)</span>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={updateComment.isPending}
              >
                Lưu
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
              >
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-3 w-3" />
                    Sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
