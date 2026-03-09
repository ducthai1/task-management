"use client";

import { use } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ExportOptions = dynamic(
  () => import("@/components/export/export-options").then((mod) => mod.ExportOptions),
  { loading: () => <Skeleton className="h-64" />, ssr: false }
);
import { ArrowLeft, Download } from "lucide-react";

export default function ExportPage({
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
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Khong tim thay du an</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6" />
            Xuat bao cao
          </h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Export Options */}
      <ExportOptions projectId={projectId} />

      {/* Info */}
      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <p className="font-medium mb-2">Luu y:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>File PDF se duoc tai xuong tu dong</li>
          <li>Ho tro in an voi khoi A4</li>
          <li>Du lieu la snapshot tai thoi diem xuat</li>
        </ul>
      </div>
    </div>
  );
}
