"use client";

import { useState } from "react";
import type { Attachment } from "@/types/database";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface FilePreviewDialogProps {
  attachment: Attachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  downloadUrl?: string;
}

export function FilePreviewDialog({
  attachment,
  open,
  onOpenChange,
  downloadUrl,
}: FilePreviewDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!attachment) return null;

  const isImage = attachment.file_type?.startsWith("image/");
  const isPDF = attachment.file_type === "application/pdf";

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetView();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[900px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span className="truncate">{attachment.file_name}</span>
            <div className="flex items-center gap-1">
              {isImage && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              {downloadUrl && (
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center min-h-[400px] max-h-[70vh] overflow-auto bg-muted/30 rounded-lg">
          {isImage && downloadUrl ? (
            <div
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: "transform 0.2s ease",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={downloadUrl}
                alt={attachment.file_name}
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          ) : isPDF && downloadUrl ? (
            <iframe
              src={downloadUrl}
              className="w-full h-[60vh]"
              title={attachment.file_name}
            />
          ) : (
            <div className="text-center p-8">
              <p className="text-muted-foreground mb-4">
                Khong the xem truoc file nay
              </p>
              {downloadUrl && (
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Tai xuong
                </Button>
              )}
            </div>
          )}
        </div>

        {attachment.file_size && (
          <p className="text-xs text-muted-foreground text-center">
            Kich thuoc: {(attachment.file_size / 1024).toFixed(1)} KB
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
