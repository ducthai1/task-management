"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Template, TemplateTask, TemplateBudgetCategory } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useTemplates(type?: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["templates", type],
    queryFn: async () => {
      let query = supabase
        .from("templates")
        .select("*")
        .order("is_system", { ascending: false })
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Template[];
    },
  });
}

export function useTemplate(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["templates", "detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Template;
    },
    enabled: !!id,
  });
}

export function useApplyTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      templateId,
    }: {
      projectId: string;
      templateId: string;
    }) => {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) throw templateError;

      const templateData = template as Template;
      const tasks = (templateData.tasks as unknown as TemplateTask[]) || [];
      const categories = (templateData.budget_categories as unknown as TemplateBudgetCategory[]) || [];

      // Insert tasks
      if (tasks.length > 0) {
        const tasksToInsert = tasks.map((t, index) => ({
          project_id: projectId,
          title: t.title,
          description: t.description || null,
          category: t.category || null,
          priority: t.priority || "medium",
          estimated_cost: t.estimated_cost || 0,
          actual_cost: 0,
          status: "todo",
          position: index,
        }));

        const { error: tasksError } = await supabase
          .from("tasks")
          .insert(tasksToInsert as never);

        if (tasksError) throw tasksError;
      }

      // Insert budget categories
      if (categories.length > 0) {
        const categoriesToInsert = categories.map((c) => ({
          project_id: projectId,
          name: c.name,
          allocated_amount: c.allocated_amount,
          color: c.color || null,
        }));

        const { error: categoriesError } = await supabase
          .from("budget_categories")
          .insert(categoriesToInsert as never);

        if (categoriesError) throw categoriesError;
      }

      return { projectId, tasksCount: tasks.length, categoriesCount: categories.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["budget_categories", data.projectId] });
      toast({
        title: "Áp dụng template thành công",
        description: `Đã thêm ${data.tasksCount} công việc và ${data.categoriesCount} danh mục ngân sách.`,
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
