"use client";

import { useState } from "react";
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import type { Project } from "@/types/database";
import { ProjectCard } from "./project-card";
import { ProjectForm } from "./project-form";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderKanban } from "lucide-react";

export function ProjectList() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async (data: Partial<Project>) => {
    if (!user) return;
    await createProject.mutateAsync({
      ...data,
      owner_id: user.id,
    } as Project);
    setFormOpen(false);
  };

  const handleUpdate = async (data: Partial<Project>) => {
    if (!editingProject) return;
    await updateProject.mutateAsync({
      id: editingProject.id,
      ...data,
    });
    setEditingProject(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteProject.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (!projects?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">Chưa có dự án nào</h3>
        <p className="text-muted-foreground mb-4">
          Tạo dự án đầu tiên để bắt đầu quản lý công việc
        </p>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo dự án
        </Button>
        <ProjectForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleCreate}
          isLoading={createProject.isPending}
        />
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={(p) => setEditingProject(p)}
            onDelete={(id) => setDeleteId(id)}
          />
        ))}
      </div>

      {/* Create Form */}
      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />

      {/* Edit Form */}
      <ProjectForm
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
        onSubmit={handleUpdate}
        defaultValues={editingProject || undefined}
        isLoading={updateProject.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa dự án này? Tất cả tasks và dữ liệu liên
              quan sẽ bị xóa vĩnh viễn.
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
    </>
  );
}
