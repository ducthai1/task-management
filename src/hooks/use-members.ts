"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProjectMember, Profile } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export type MemberWithProfile = ProjectMember & {
  profile?: Profile | null;
};

interface ProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string | null;
  invited_email: string | null;
  role: "owner" | "editor" | "viewer";
  invite_status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export function useProjectMembers(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["project_members", projectId],
    queryFn: async () => {
      // Fetch members
      const { data: members, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!members || members.length === 0) return [];

      const typedMembers = members as ProjectMemberRow[];

      // Fetch user profiles separately
      const userIds = typedMembers
        .map((m) => m.user_id)
        .filter((id): id is string => id !== null);

      if (userIds.length === 0) {
        return typedMembers.map((m) => ({ ...m, profile: null })) as MemberWithProfile[];
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles as Profile[])?.map((p) => [p.id, p]) || []);

      return typedMembers.map((m) => ({
        ...m,
        profile: m.user_id ? profileMap.get(m.user_id) || null : null,
      })) as MemberWithProfile[];
    },
    enabled: !!projectId,
  });
}

export function useMyInvites() {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["my_invites"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return [];

      // Fetch invites
      const { data: invites, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("invited_email", user.email)
        .eq("invite_status", "pending");

      if (error) throw error;
      if (!invites || invites.length === 0) return [];

      const typedInvites = invites as ProjectMemberRow[];

      // Fetch projects separately
      const projectIds = typedInvites.map((i) => i.project_id);
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, type")
        .in("id", projectIds);

      interface ProjectBasic { id: string; name: string; type: string; }
      const projectMap = new Map((projects as ProjectBasic[] | null)?.map((p) => [p.id, p]) || []);

      return typedInvites.map((i) => ({
        ...i,
        project: projectMap.get(i.project_id) || null,
      }));
    },
  });
}

interface InviteMemberInput {
  project_id: string;
  invited_email: string;
  role: "editor" | "viewer";
}

export function useInviteMember() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      // Check if already invited
      const { data: existing } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", input.project_id)
        .eq("invited_email", input.invited_email)
        .single();

      if (existing) {
        throw new Error("Email này đã được mời vào dự án");
      }

      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: input.project_id,
          invited_email: input.invited_email,
          role: input.role,
          invite_status: "pending",
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_members", data.project_id] });
      toast({
        title: "Gửi lời mời thành công",
        description: `Đã gửi lời mời đến ${data.invited_email}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAcceptInvite() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Chưa đăng nhập");

      const { data, error } = await supabase
        .from("project_members")
        .update({
          user_id: user.id,
          invite_status: "accepted",
        } as never)
        .eq("id", inviteId)
        .eq("invited_email", user.email)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_members", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["my_invites"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "Đã chấp nhận lời mời",
        description: "Bạn đã tham gia dự án.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectInvite() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error("Chưa đăng nhập");

      const { data, error } = await supabase
        .from("project_members")
        .update({ invite_status: "rejected" } as never)
        .eq("id", inviteId)
        .eq("invited_email", user.email)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMember;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_invites"] });
      toast({
        title: "Đã từ chối lời mời",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMemberRole() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      role,
    }: {
      id: string;
      role: "editor" | "viewer";
    }) => {
      const { data, error } = await supabase
        .from("project_members")
        .update({ role } as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_members", data.project_id] });
      toast({
        title: "Cập nhật quyền thành công",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRemoveMember() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project_members", data.projectId] });
      toast({
        title: "Đã xóa thành viên",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
