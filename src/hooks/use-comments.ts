"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

// Supabase JOIN select — fetches comment + user profile in single query
const COMMENT_SELECT = "id, task_id, user_id, content, created_at, updated_at, user:profiles!comments_user_id_profiles_fkey(id, full_name, avatar_url)";

export function useComments(taskId: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(COMMENT_SELECT)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as Comment[];
    },
    enabled: !!taskId,
  });

  // Realtime subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, supabase, queryClient]);

  return query;
}

export function useAddComment() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, content }: { taskId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      const { data, error } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          user_id: user.id,
          content,
        } as never)
        .select(COMMENT_SELECT)
        .single();

      if (error) throw error;
      return data as Comment;
    },
    // Optimistic update — show comment instantly
    onMutate: async ({ taskId, content }) => {
      await queryClient.cancelQueries({ queryKey: ["comments", taskId] });
      const previous = queryClient.getQueryData<Comment[]>(["comments", taskId]);
      const optimistic: Comment = {
        id: `temp-${Date.now()}`,
        task_id: taskId,
        user_id: "optimistic",
        content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Comment[]>(
        ["comments", taskId],
        (old) => [...(old || []), optimistic]
      );
      return { previous, taskId };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["comments", context.taskId], context.previous);
      }
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

export function useUpdateComment() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, taskId, content }: { id: string; taskId: string; content: string }) => {
      const { data, error } = await supabase
        .from("comments")
        .update({ content, updated_at: new Date().toISOString() } as never)
        .eq("id", id)
        .select(COMMENT_SELECT)
        .single();

      if (error) throw error;
      return { ...(data as Comment), taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
      toast({
        title: "Đã cập nhật",
        description: "Bình luận đã được cập nhật.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteComment() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
      return { taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
      toast({
        title: "Đã xóa",
        description: "Bình luận đã được xóa.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
