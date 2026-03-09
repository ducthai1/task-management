"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cloud, CloudOff, RefreshCw, Loader2 } from "lucide-react";

export function OfflineIndicator() {
  const { isOnline, pendingCount, isSyncing, syncPendingItems } = useOfflineSync();

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online and synced
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {!isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1">
                <CloudOff className="h-3 w-3" />
                Offline
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Đang hoạt động ngoại tuyến</p>
              <p className="text-xs text-muted-foreground">
                Dữ liệu sẽ đồng bộ khi có mạng
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {pendingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => syncPendingItems()}
                disabled={!isOnline || isSyncing}
                className="h-7 gap-1 px-2"
              >
                {isSyncing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                <span className="text-xs">{pendingCount}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{pendingCount} thay đổi chờ đồng bộ</p>
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  Kết nối mạng để đồng bộ
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        )}

        {isOnline && pendingCount === 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 text-green-600">
                <Cloud className="h-3 w-3" />
                Synced
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Đã đồng bộ xong</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
