"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task, Insertable, Updatable } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

// Fetch all tasks across all projects (for dashboard)
export function useAllTasks() {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard
  });
}

export function useTasks(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!projectId,
  });
}

export function useTask(id: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["tasks", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Task;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (task: Insertable<"tasks">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert(task as never)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    // Optimistic update — show task instantly in list
    onMutate: async (newTask) => {
      const projectId = newTask.project_id;
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previous = queryClient.getQueryData<Task[]>(["tasks", projectId]);
      const optimistic: Task = {
        id: `temp-${Date.now()}`,
        project_id: projectId,
        parent_id: null,
        title: newTask.title || "",
        description: newTask.description || null,
        status: newTask.status || "todo",
        priority: newTask.priority || "medium",
        category: newTask.category || null,
        assignee_id: newTask.assignee_id || null,
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
        estimated_cost: newTask.estimated_cost || 0,
        actual_cost: newTask.actual_cost || 0,
        notes: newTask.notes || null,
        position: (previous?.length || 0) + 1,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Task[]>(
        ["tasks", projectId],
        (old) => [...(old || []), optimistic]
      );
      return { previous, projectId };
    },
    onSuccess: () => {
      toast({
        title: "Tạo task thành công",
        description: "Task mới đã được thêm.",
      });
    },
    onError: (error, newTask, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["tasks", context.projectId], context.previous);
      }
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      }
    },
  });
}

export function useUpdateTask() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Updatable<"tasks"> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", data.id] });
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

export function useDeleteTask() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.projectId] });
      toast({
        title: "Xóa thành công",
        description: "Task đã được xóa.",
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

export function useUpdateTaskStatus() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      projectId,
    }: {
      id: string;
      status: Task["status"];
      projectId: string;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update({ status } as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Task, projectId };
    },
    onMutate: async ({ id, status, projectId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks", projectId]);

      queryClient.setQueryData<Task[]>(["tasks", projectId], (old) =>
        old?.map((task) => (task.id === id ? { ...task, status } : task))
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["tasks", variables.projectId],
          context.previousTasks
        );
      }
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["tasks", data.projectId] });
      }
    },
  });
}
