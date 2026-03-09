"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Attachment } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface AttachmentRow {
  id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export function useAttachments(taskId: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as AttachmentRow[]) || [];
    },
    enabled: !!taskId,
  });
}

export function useUploadAttachment() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Chưa đăng nhập");

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File quá lớn (tối đa 10MB)");
      }

      const filePath = `${user.id}/${taskId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error } = await supabase
        .from("attachments")
        .insert({
          task_id: taskId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user.id,
        } as never)
        .select("*")
        .single();

      if (error) throw error;
      return data as Attachment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", variables.taskId] });
      toast({
        title: "Đã tải lên",
        description: "File đã được tải lên thành công.",
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi tải lên",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAttachment() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, taskId, filePath }: { id: string; taskId: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([filePath]);

      if (storageError) {
        console.warn("Storage delete failed:", storageError);
      }

      // Delete record
      const { error } = await supabase.from("attachments").delete().eq("id", id);
      if (error) throw error;

      return { taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", data.taskId] });
      toast({
        title: "Đã xóa",
        description: "File đã được xóa.",
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

export function useDownloadAttachment() {
  const supabase = useMemo(() => createClient(), []);

  return useMutation({
    mutationFn: async ({ filePath, fileName }: { filePath: string; fileName: string }) => {
      const { data, error } = await supabase.storage
        .from("attachments")
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);

      return true;
    },
  });
}
