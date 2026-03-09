"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityLog } from "@/types/database";

// Supabase JOIN — fetches activity log + user profile in single query
const ACTIVITY_SELECT = "*, user:profiles!activity_logs_user_id_profiles_fkey(id, full_name, avatar_url)";

export function useActivityLogs(projectId: string, entityType?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["activity_logs", projectId, entityType],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select(ACTIVITY_SELECT)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ActivityLog[];
    },
    enabled: !!projectId,
  });
}

// Client-side activity logger (for immediate logging)
export async function logActivityClient({
  projectId,
  action,
  entityType,
  entityId,
  entityName,
  changes,
}: {
  projectId: string;
  action: "create" | "update" | "delete";
  entityType: "task" | "guest" | "budget" | "member";
  entityId: string;
  entityName?: string;
  changes?: Record<string, unknown>;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  try {
    await supabase.from("activity_logs").insert({
      project_id: projectId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || null,
      changes: changes || null,
    } as never);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
