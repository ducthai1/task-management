"use client";

import { useState } from "react";
import type { Attachment } from "@/types/database";
import { useAttachments, useDeleteAttachment, useDownloadAttachment } from "@/hooks/use-attachments";
import { UploadButton } from "./upload-button";
import { FilePreviewDialog } from "./file-preview-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Paperclip, Download, Trash2, FileText, FileImage, File, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AttachmentListProps {
  taskId: string;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string | null) {
  if (!fileType) return File;
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("pdf") || fileType.includes("document")) return FileText;
  return File;
}

function canPreview(fileType: string | null): boolean {
  if (!fileType) return false;
  return fileType.startsWith("image/") || fileType === "application/pdf";
}

export function AttachmentList({ taskId }: AttachmentListProps) {
  const { data: attachments, isLoading } = useAttachments(taskId);
  const deleteAttachment = useDeleteAttachment();
  const downloadAttachment = useDownloadAttachment();

  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  const handlePreview = async (attachment: Attachment) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("attachments")
      .createSignedUrl(attachment.file_path, 3600);

    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setPreviewAttachment(attachment);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          Tep dinh kem ({attachments?.length || 0})
        </div>
        <UploadButton taskId={taskId} />
      </div>

      {attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.file_type);
            const previewable = canPreview(attachment.file_type);

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>
                <div className="flex gap-1">
                  {previewable && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePreview(attachment)}
                      title="Xem truoc"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() =>
                      downloadAttachment.mutate({
                        filePath: attachment.file_path,
                        fileName: attachment.file_name,
                      })
                    }
                    disabled={downloadAttachment.isPending}
                    title="Tai xuong"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm("Ban co chac muon xoa file nay?")) {
                        deleteAttachment.mutate({
                          id: attachment.id,
                          taskId,
                          filePath: attachment.file_path,
                        });
                      }
                    }}
                    disabled={deleteAttachment.isPending}
                    title="Xoa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Chua co tep dinh kem
        </p>
      )}

      {/* File Preview Dialog */}
      <FilePreviewDialog
        attachment={previewAttachment}
        open={!!previewAttachment}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewAttachment(null);
            setPreviewUrl(undefined);
          }
        }}
        downloadUrl={previewUrl}
      />
    </div>
  );
}
