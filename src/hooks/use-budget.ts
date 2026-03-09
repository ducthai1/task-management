"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BudgetCategory } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useBudgetCategories(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["budget_categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as BudgetCategory[];
    },
    enabled: !!projectId,
  });
}

interface CreateCategoryInput {
  project_id: string;
  name: string;
  allocated_amount?: number;
  color?: string | null;
}

export function useCreateBudgetCategory() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (category: CreateCategoryInput) => {
      const { data, error } = await supabase
        .from("budget_categories")
        .insert(category as never)
        .select()
        .single();

      if (error) throw error;
      return data as BudgetCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["budget_categories", data.project_id],
      });
      toast({
        title: "Tạo danh mục thành công",
        description: "Danh mục ngân sách mới đã được thêm.",
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

interface UpdateCategoryInput {
  id: string;
  name?: string;
  allocated_amount?: number;
  color?: string | null;
}

export function useUpdateBudgetCategory() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCategoryInput) => {
      const { data, error } = await supabase
        .from("budget_categories")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as BudgetCategory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["budget_categories", data.project_id],
      });
      toast({
        title: "Cập nhật thành công",
        description: "Danh mục ngân sách đã được cập nhật.",
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

export function useDeleteBudgetCategory() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
    }: {
      id: string;
      projectId: string;
    }) => {
      const { error } = await supabase
        .from("budget_categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["budget_categories", data.projectId],
      });
      toast({
        title: "Xóa thành công",
        description: "Danh mục ngân sách đã được xóa.",
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
