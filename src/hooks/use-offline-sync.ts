"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { db, getPendingSyncItems, markTaskSynced, markGuestSynced } from "@/lib/db";
import { useOnlineStatus } from "./use-online-status";
import { createClient } from "@/lib/supabase/client";

export function useOfflineSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const isOnline = useOnlineStatus();
  const supabase = useMemo(() => createClient(), []);

  // Count pending items
  const updatePendingCount = useCallback(async () => {
    try {
      const { tasks, guests } = await getPendingSyncItems();
      setPendingCount(tasks.length + guests.length);
    } catch {
      // IndexedDB not available
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Sync when online
  const syncPendingItems = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const { tasks, guests } = await getPendingSyncItems();

      // Sync tasks
      for (const task of tasks) {
        try {
          if (task.syncAction === "create") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { syncPending: _sp, syncAction: _sa, lastModified: _lm, ...taskData } = task;
            await supabase.from("tasks").insert(taskData as never);
          } else if (task.syncAction === "update") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { syncPending: _sp, syncAction: _sa, lastModified: _lm, id, ...updates } = task;
            await supabase.from("tasks").update(updates as never).eq("id", id);
          } else if (task.syncAction === "delete") {
            await supabase.from("tasks").delete().eq("id", task.id);
            await db.tasks.delete(task.id);
            continue;
          }
          await markTaskSynced(task.id);
        } catch (error) {
          console.error("Task sync failed:", task.id, error);
        }
      }

      // Sync guests
      for (const guest of guests) {
        try {
          if (guest.syncAction === "update") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { syncPending: _sp, syncAction: _sa, lastModified: _lm, id, ...updates } = guest;
            await supabase.from("guests").update(updates as never).eq("id", id);
          }
          await markGuestSynced(guest.id);
        } catch (error) {
          console.error("Guest sync failed:", guest.id, error);
        }
      }

      setLastSyncTime(new Date());
      await updatePendingCount();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, supabase, updatePendingCount]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncPendingItems();
    }
  }, [isOnline, pendingCount, syncPendingItems]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncPendingItems,
    updatePendingCount,
  };
}
