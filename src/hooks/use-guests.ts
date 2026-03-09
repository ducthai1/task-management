"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Guest } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useGuests(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["guests", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!projectId,
  });
}

export function useGuestGroups(projectId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["guest_groups", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guests")
        .select("group_name")
        .eq("project_id", projectId)
        .not("group_name", "is", null)
        .returns<{ group_name: string | null }[]>();

      if (error) throw error;
      const groups = [...new Set(data.map((g) => g.group_name))].filter(Boolean);
      return groups as string[];
    },
    enabled: !!projectId,
  });
}

export function useGuestStats(projectId: string) {
  const { data: guests } = useGuests(projectId);

  const stats = {
    total: guests?.length || 0,
    confirmed: guests?.filter((g) => g.rsvp_status === "confirmed").length || 0,
    declined: guests?.filter((g) => g.rsvp_status === "declined").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
    totalRsvpCount: guests?.reduce((sum, g) => sum + (g.rsvp_status === "confirmed" ? g.rsvp_count : 0), 0) || 0,
    checkedIn: guests?.filter((g) => g.checked_in).length || 0,
    invitationSent: guests?.filter((g) => g.invitation_sent).length || 0,
  };

  return stats;
}

interface CreateGuestInput {
  project_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  group_name?: string | null;
  rsvp_status?: "pending" | "confirmed" | "declined";
  rsvp_count?: number;
  table_number?: string | null;
  notes?: string | null;
}

export function useCreateGuest() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (guest: CreateGuestInput) => {
      const { data, error } = await supabase
        .from("guests")
        .insert(guest as never)
        .select()
        .single();

      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["guest_groups", data.project_id] });
      toast({
        title: "Thêm khách thành công",
        description: `${data.name} đã được thêm vào danh sách.`,
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

interface UpdateGuestInput {
  id: string;
  name?: string;
  phone?: string | null;
  email?: string | null;
  group_name?: string | null;
  invitation_sent?: boolean;
  invitation_sent_at?: string | null;
  rsvp_status?: "pending" | "confirmed" | "declined";
  rsvp_count?: number;
  table_number?: string | null;
  checked_in?: boolean;
  checked_in_at?: string | null;
  gift_amount?: number | null;
  notes?: string | null;
}

export function useUpdateGuest() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateGuestInput) => {
      const { data, error } = await supabase
        .from("guests")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Guest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["guest_groups", data.project_id] });
      toast({
        title: "Cập nhật thành công",
        description: `Thông tin ${data.name} đã được cập nhật.`,
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

export function useDeleteGuest() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("guests").delete().eq("id", id);
      if (error) throw error;
      return { id, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["guest_groups", data.projectId] });
      toast({
        title: "Xóa thành công",
        description: "Khách đã được xóa khỏi danh sách.",
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

export function useBulkUpdateRsvp() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      ids,
      projectId,
      rsvp_status,
    }: {
      ids: string[];
      projectId: string;
      rsvp_status: "pending" | "confirmed" | "declined";
    }) => {
      const { error } = await supabase
        .from("guests")
        .update({ rsvp_status } as never)
        .in("id", ids);

      if (error) throw error;
      return { ids, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["guests", data.projectId] });
      toast({
        title: "Cập nhật RSVP thành công",
        description: `Đã cập nhật ${data.ids.length} khách.`,
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
