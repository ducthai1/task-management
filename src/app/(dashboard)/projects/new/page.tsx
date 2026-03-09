"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCreateProject } from "@/hooks/use-projects";
import { ProjectForm } from "@/components/projects/project-form";
import type { Project } from "@/types/database";

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const createProject = useCreateProject();

  const handleCreate = async (data: Partial<Project>) => {
    if (!user) return;
    const project = await createProject.mutateAsync({
      ...data,
      owner_id: user.id,
    } as Project);
    router.push(`/projects/${project.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tạo dự án mới</h1>
      <ProjectForm
        open={true}
        onOpenChange={(open) => !open && router.back()}
        onSubmit={handleCreate}
        isLoading={createProject.isPending}
      />
    </div>
  );
}
