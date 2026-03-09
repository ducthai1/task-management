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

// Pure function — derive stats from guests data, no extra fetch
export function computeGuestStats(guests: Guest[] | undefined) {
  if (!guests) return { total: 0, confirmed: 0, declined: 0, pending: 0, totalRsvpCount: 0, checkedIn: 0, invitationSent: 0 };
  return {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvp_status === "confirmed").length,
    declined: guests.filter((g) => g.rsvp_status === "declined").length,
    pending: guests.filter((g) => g.rsvp_status === "pending").length,
    totalRsvpCount: guests.reduce((sum, g) => sum + (g.rsvp_status === "confirmed" ? g.rsvp_count : 0), 0),
    checkedIn: guests.filter((g) => g.checked_in).length,
    invitationSent: guests.filter((g) => g.invitation_sent).length,
  };
}

// Pure function — derive unique group names from guests data, no extra fetch
export function deriveGuestGroups(guests: Guest[] | undefined): string[] {
  if (!guests) return [];
  return [...new Set(guests.map((g) => g.group_name).filter(Boolean))] as string[];
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
    // Optimistic update — show guest instantly
    onMutate: async (newGuest) => {
      await queryClient.cancelQueries({ queryKey: ["guests", newGuest.project_id] });
      const previous = queryClient.getQueryData<Guest[]>(["guests", newGuest.project_id]);
      const optimistic: Guest = {
        id: `temp-${Date.now()}`,
        project_id: newGuest.project_id,
        name: newGuest.name,
        phone: newGuest.phone || null,
        email: newGuest.email || null,
        group_name: newGuest.group_name || null,
        invitation_sent: false,
        invitation_sent_at: null,
        rsvp_status: newGuest.rsvp_status || "pending",
        rsvp_count: newGuest.rsvp_count || 1,
        table_number: newGuest.table_number || null,
        qr_code: null,
        checked_in: false,
        checked_in_at: null,
        gift_amount: null,
        notes: newGuest.notes || null,
        source: "manual",
        external_id: null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Guest[]>(
        ["guests", newGuest.project_id],
        (old) => [optimistic, ...(old || [])]
      );
      return { previous };
    },
    onError: (error, newGuest, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["guests", newGuest.project_id], context.previous);
      }
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Thêm khách thành công",
        description: `${data.name} đã được thêm vào danh sách.`,
      });
    },
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["guests", data.project_id] });
      }
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
