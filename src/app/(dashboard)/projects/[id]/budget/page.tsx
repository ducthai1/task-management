"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import {
  useBudgetCategories,
  useCreateBudgetCategory,
  useUpdateBudgetCategory,
  useDeleteBudgetCategory,
} from "@/hooks/use-budget";
import type { BudgetCategory } from "@/types/database";
import { BudgetSummary } from "@/components/budget/budget-summary";
import { BudgetCategoryForm } from "@/components/budget/budget-category-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, ArrowLeft } from "lucide-react";

export default function BudgetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: categories, isLoading: categoriesLoading } =
    useBudgetCategories(projectId);

  const createCategory = useCreateBudgetCategory();
  const updateCategory = useUpdateBudgetCategory();
  const deleteCategory = useDeleteBudgetCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<BudgetCategory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: Partial<BudgetCategory>) => {
    await createCategory.mutateAsync({
      ...data,
      project_id: projectId,
    } as BudgetCategory);
    setFormOpen(false);
  };

  const handleUpdate = async (data: Partial<BudgetCategory>) => {
    if (!editingCategory) return;
    await updateCategory.mutateAsync({
      id: editingCategory.id,
      ...data,
    });
    setEditingCategory(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCategory.mutateAsync({ id: deleteId, projectId });
    setDeleteId(null);
  };

  // Only show "not found" after loading completes
  if (!projectLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Always render immediately */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Ngân sách - {projectLoading ? <Skeleton className="h-6 w-32 inline-block" /> : project?.name}
          </h1>
          <p className="text-muted-foreground">
            Theo dõi chi tiêu và ngân sách dự án
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {/* Budget Summary - Skeleton only for data */}
      {categoriesLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <BudgetSummary
          categories={categories || []}
          tasks={tasks || []}
          onEditCategory={setEditingCategory}
          onDeleteCategory={setDeleteId}
        />
      )}

      {/* Create Form */}
      <BudgetCategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isLoading={createCategory.isPending}
      />

      {/* Edit Form */}
      <BudgetCategoryForm
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        onSubmit={handleUpdate}
        defaultValues={editingCategory || undefined}
        isLoading={updateCategory.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
