"use client";

import { useState } from "react";
import { useSyncFromSheet, useSyncLogs } from "@/hooks/use-sync-logs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileSpreadsheet, ArrowRight, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SyncDialogProps {
  projectId: string;
}

const guestFields = [
  { value: "name", label: "Tên khách *" },
  { value: "phone", label: "Số điện thoại" },
  { value: "email", label: "Email" },
  { value: "group_name", label: "Nhóm" },
  { value: "rsvp_status", label: "Trạng thái RSVP" },
  { value: "rsvp_count", label: "Số người" },
  { value: "table_number", label: "Số bàn" },
  { value: "notes", label: "Ghi chú" },
];

export function SyncDialog({ projectId }: SyncDialogProps) {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    name: "Tên",
    phone: "SĐT",
    email: "Email",
    group_name: "Nhóm",
    rsvp_status: "RSVP",
    rsvp_count: "Số người",
    table_number: "Bàn",
    notes: "Ghi chú",
  });

  const syncFromSheet = useSyncFromSheet();
  const { data: logs } = useSyncLogs(projectId);

  const extractSpreadsheetId = (input: string): string => {
    // Handle full URL or just ID
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
  };

  const handleSync = async () => {
    const id = extractSpreadsheetId(spreadsheetId);
    if (!id) return;

    await syncFromSheet.mutateAsync({
      projectId,
      spreadsheetId: id,
      sheetName,
      columnMapping,
    });
  };

  const updateMapping = (field: string, value: string) => {
    setColumnMapping((prev) => ({ ...prev, [field]: value }));
  };

  const statusConfig = {
    success: { icon: CheckCircle, color: "text-green-500", label: "Thành công" },
    partial: { icon: AlertCircle, color: "text-yellow-500", label: "Một phần" },
    failed: { icon: XCircle, color: "text-red-500", label: "Lỗi" },
  };

  return (
    <div className="space-y-6">
      {/* Setup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Cấu hình Google Sheets
          </CardTitle>
          <CardDescription>
            Nhập URL hoặc ID của Google Sheet và cấu hình mapping cột
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheet">URL hoặc ID Google Sheet *</Label>
              <Input
                id="spreadsheet"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Đảm bảo đã chia sẻ Sheet với Service Account
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sheet">Tên Sheet</Label>
              <Input
                id="sheet"
                placeholder="Sheet1"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Ánh xạ cột (Column Mapping)</Label>
            <p className="text-sm text-muted-foreground">
              Nhập tên cột trong Sheet tương ứng với mỗi trường
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {guestFields.map((field) => (
                <div key={field.value} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  <Input
                    placeholder={`Tên cột cho ${field.label}`}
                    value={columnMapping[field.value] || ""}
                    onChange={(e) => updateMapping(field.value, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSync}
            disabled={!spreadsheetId || syncFromSheet.isPending}
            className="w-full"
          >
            {syncFromSheet.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đồng bộ...
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Đồng bộ ngay
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đồng bộ</CardTitle>
        </CardHeader>
        <CardContent>
          {!logs || logs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Chưa có lịch sử đồng bộ
            </p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => {
                const config = statusConfig[log.status];
                const Icon = config.icon;
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${config.color}`} />
                      <div>
                        <p className="text-sm font-medium">
                          {log.records_synced} khách đã đồng bộ
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.synced_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        log.status === "success"
                          ? "default"
                          : log.status === "partial"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
