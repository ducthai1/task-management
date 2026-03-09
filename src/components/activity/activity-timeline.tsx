"use client";

import type { ActivityLog } from "@/types/database";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface ActivityTimelineProps {
  activities: ActivityLog[];
}

const actionConfig = {
  create: { icon: Plus, label: "đã tạo", color: "bg-green-100 text-green-800" },
  update: { icon: Pencil, label: "đã cập nhật", color: "bg-blue-100 text-blue-800" },
  delete: { icon: Trash2, label: "đã xóa", color: "bg-red-100 text-red-800" },
};

const entityLabels = {
  task: "công việc",
  guest: "khách mời",
  budget: "ngân sách",
  member: "thành viên",
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Chưa có hoạt động nào
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const config = actionConfig[activity.action];
        const Icon = config.icon;
        const displayName = activity.user?.full_name || "User";
        const initials = displayName.charAt(0).toUpperCase();

        return (
          <div key={activity.id} className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">{displayName}</span>
                <Badge variant="secondary" className={`text-xs ${config.color}`}>
                  <Icon className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-sm">
                  {entityLabels[activity.entity_type]}
                </span>
              </div>

              {activity.entity_name && (
                <p className="text-sm text-muted-foreground">
                  &quot;{activity.entity_name}&quot;
                </p>
              )}

              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.created_at), {
                  addSuffix: true,
                  locale: vi,
                })}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}
