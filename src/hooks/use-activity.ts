"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ActivityLog, Profile } from "@/types/database";

interface ActivityLogRow {
  id: string;
  project_id: string;
  user_id: string;
  action: "create" | "update" | "delete";
  entity_type: "task" | "guest" | "budget" | "member";
  entity_id: string;
  entity_name: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

export function useActivityLogs(projectId: string, entityType?: string) {
  const supabase = useMemo(() => createClient(), []);

  return useQuery({
    queryKey: ["activity_logs", projectId, entityType],
    queryFn: async () => {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (entityType) {
        query = query.eq("entity_type", entityType);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];

      const typedLogs = data as ActivityLogRow[];

      // Fetch user profiles separately
      const userIds = [...new Set(typedLogs.map((log) => log.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles as Profile[])?.map((p) => [p.id, p]) || []);

      return typedLogs.map((log) => ({
        ...log,
        user: profileMap.get(log.user_id) || undefined,
      })) as ActivityLog[];
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
