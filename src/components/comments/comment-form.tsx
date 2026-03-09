"use client";

import { useState } from "react";
import { useAddComment } from "@/hooks/use-comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";

interface CommentFormProps {
  taskId: string;
}

export function CommentForm({ taskId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const addComment = useAddComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    addComment.mutate(
      { taskId, content: content.trim() },
      {
        onSuccess: () => setContent(""),
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Viết bình luận..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[80px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            handleSubmit(e);
          }
        }}
      />
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Cmd/Ctrl + Enter để gửi
        </span>
        <Button type="submit" size="sm" disabled={!content.trim() || addComment.isPending}>
          {addComment.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Gửi
        </Button>
      </div>
    </form>
  );
}
