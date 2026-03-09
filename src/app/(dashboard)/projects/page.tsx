"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@/hooks/use-projects";
import { ProjectList } from "@/components/projects/project-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import type { Project } from "@/types/database";
import { Plus } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const createProject = useCreateProject();
  const [formOpen, setFormOpen] = useState(false);

  const handleCreate = async (data: Partial<Project>) => {
    if (!user) return;
    await createProject.mutateAsync({
      ...data,
      owner_id: user.id,
    } as Project);
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dự án</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả dự án của bạn tại đây
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tạo dự án
        </Button>
      </div>

      <ProjectList />

      <ProjectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />
    </div>
  );
}
