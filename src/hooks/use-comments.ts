"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Comment, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface CommentRow {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useComments(taskId: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      // Fetch comments
      const { data: comments, error } = await supabase
        .from("comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      const typedComments = comments as CommentRow[];

      // Fetch user profiles separately
      const userIds = [...new Set(typedComments.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Merge profiles into comments
      const profileMap = new Map((profiles as Profile[])?.map((p) => [p.id, p]) || []);
      return typedComments.map((c) => ({
        ...c,
        user: profileMap.get(c.user_id) || undefined,
      })) as Comment[];
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
        .select("*")
        .single();

      if (error) throw error;

      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", user.id)
        .single();

      const commentData = data as CommentRow;
      return { ...commentData, user: profile || undefined } as Comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.taskId] });
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
        .select("*")
        .single();

      if (error) throw error;
      const commentData = data as CommentRow;
      return { ...commentData, taskId };
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
