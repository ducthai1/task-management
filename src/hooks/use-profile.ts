"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function useProfile(userId: string | undefined) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      full_name,
      avatar_url,
    }: {
      id: string;
      full_name?: string | null;
      avatar_url?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({ full_name, avatar_url } as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile", data.id] });
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin hồ sơ đã được lưu.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật hồ sơ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useChangePassword() {
  const supabase = useMemo(() => createClient(), []);
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Đổi mật khẩu thành công",
        description: "Mật khẩu của bạn đã được cập nhật.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi đổi mật khẩu",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
