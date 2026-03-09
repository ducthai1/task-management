"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SyncLog } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useSyncLogs(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["sync_logs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("synced_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as SyncLog[];
    },
    enabled: !!projectId,
  });
}

interface SyncFromSheetInput {
  projectId: string;
  spreadsheetId: string;
  sheetName: string;
  columnMapping: Record<string, string>;
}

export function useSyncFromSheet() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: SyncFromSheetInput) => {
      const response = await fetch("/api/sheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Sync failed");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["guests", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["sync_logs", variables.projectId] });
      toast({
        title: "Đồng bộ thành công",
        description: `Đã đồng bộ ${data.synced} khách từ Google Sheets.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Lỗi đồng bộ",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
