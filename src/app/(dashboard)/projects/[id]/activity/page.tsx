"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useActivityLogs } from "@/hooks/use-activity";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Activity } from "lucide-react";

export default function ActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);
  const { data: activities, isLoading: activitiesLoading } = useActivityLogs(
    projectId,
    entityFilter
  );

  if (projectLoading) {
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
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Lịch sử hoạt động</h1>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Lọc theo:</span>
        <Select
          value={entityFilter || "all"}
          onValueChange={(v) => setEntityFilter(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="task">Công việc</SelectItem>
            <SelectItem value="guest">Khách mời</SelectItem>
            <SelectItem value="budget">Ngân sách</SelectItem>
            <SelectItem value="member">Thành viên</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <ActivityTimeline activities={activities || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
