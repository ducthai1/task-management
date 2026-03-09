"use client";

import { use } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { SyncDialog } from "@/components/guests/sync-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export default function SyncPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}/guests`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Đồng bộ Google Sheets</h1>
          <p className="text-muted-foreground">
            Import danh sách khách từ Google Sheets vào dự án {project.name}
          </p>
        </div>
      </div>

      {/* Sync Dialog */}
      <SyncDialog projectId={projectId} />
    </div>
  );
}
