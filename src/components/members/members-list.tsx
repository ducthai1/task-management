"use client";

import type { MemberWithProfile } from "@/hooks/use-members";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/use-members";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, Trash2, Clock, Mail } from "lucide-react";

interface MembersListProps {
  members: MemberWithProfile[];
  projectId: string;
  currentUserId: string;
  isOwner: boolean;
}

const roleLabels = {
  owner: "Chủ sở hữu",
  editor: "Editor",
  viewer: "Viewer",
};

const roleColors = {
  owner: "bg-primary text-primary-foreground",
  editor: "bg-blue-100 text-blue-800",
  viewer: "bg-gray-100 text-gray-800",
};

export function MembersList({
  members,
  projectId,
  currentUserId,
  isOwner,
}: MembersListProps) {
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const handleRoleChange = async (memberId: string, role: "editor" | "viewer") => {
    await updateRole.mutateAsync({ id: memberId, role });
  };

  const handleRemove = async (memberId: string) => {
    await removeMember.mutateAsync({ id: memberId, projectId });
  };

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        Chưa có thành viên nào. Mời người khác tham gia dự án!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;
        const isPending = member.invite_status === "pending";
        const profile = member.profile;
        const displayName = profile?.full_name || member.invited_email || "Unknown";
        const initials = displayName.charAt(0).toUpperCase();

        return (
          <Card key={member.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{displayName}</p>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs">
                      Bạn
                    </Badge>
                  )}
                </div>
                {isPending ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Chờ chấp nhận</span>
                  </div>
                ) : member.invited_email && !profile?.full_name ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{member.invited_email}</span>
                  </div>
                ) : null}
              </div>

              {/* Role Badge/Selector */}
              {member.role === "owner" ? (
                <Badge className={roleColors.owner}>{roleLabels.owner}</Badge>
              ) : isOwner && !isPending ? (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v as "editor" | "viewer")}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={roleColors[member.role]}>{roleLabels[member.role]}</Badge>
              )}

              {/* Actions */}
              {isOwner && member.role !== "owner" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleRemove(member.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Xóa khỏi dự án
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
