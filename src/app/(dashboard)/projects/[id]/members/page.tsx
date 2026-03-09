"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useProjectMembers } from "@/hooks/use-members";
import { useAuth } from "@/hooks/use-auth";
import { InviteForm } from "@/components/members/invite-form";
import { MembersList } from "@/components/members/members-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Users } from "lucide-react";

export default function MembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { user } = useAuth();
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: members, isLoading: membersLoading } = useProjectMembers(projectId);

  const [inviteOpen, setInviteOpen] = useState(false);

  // Only show "not found" after loading completes
  if (!projectLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  const isOwner = project?.owner_id === user?.id;

  // Add owner to members list if not already there
  const allMembers = members || [];
  const hasOwnerInList = allMembers.some((m) => m.role === "owner");

  // Create virtual owner member if not in list
  const displayMembers = hasOwnerInList
    ? allMembers
    : project
    ? [
        {
          id: "owner",
          project_id: projectId,
          user_id: project.owner_id,
          role: "owner" as const,
          invited_email: null,
          invite_status: "accepted" as const,
          created_at: project.created_at,
          profile: null,
        },
        ...allMembers,
      ]
    : allMembers;

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
            Thành viên - {projectLoading ? <Skeleton className="h-6 w-32 inline-block" /> : project?.name}
          </h1>
          <p className="text-muted-foreground">
            Quản lý thành viên và quyền truy cập dự án
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Mời thành viên
          </Button>
        )}
      </div>

      {/* Members Card - Skeleton only for content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách thành viên
          </CardTitle>
          <CardDescription>
            {membersLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${displayMembers.length} thành viên trong dự án`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <MembersList
              members={displayMembers}
              projectId={projectId}
              currentUserId={user?.id || ""}
              isOwner={isOwner || false}
            />
          )}
        </CardContent>
      </Card>

      {/* Info Card for non-owners */}
      {!projectLoading && !isOwner && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Bạn đang xem dự án với vai trò{" "}
              <strong>
                {allMembers.find((m) => m.user_id === user?.id)?.role === "editor"
                  ? "Editor"
                  : "Viewer"}
              </strong>
              . Chỉ chủ sở hữu mới có thể mời và quản lý thành viên.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invite Form */}
      <InviteForm
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={projectId}
      />
    </div>
  );
}
