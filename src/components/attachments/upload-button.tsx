"use client";

import { useRef } from "react";
import { useUploadAttachment } from "@/hooks/use-attachments";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";

interface UploadButtonProps {
  taskId: string;
}

export function UploadButton({ taskId }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    uploadAttachment.mutate(
      { taskId, file },
      {
        onSettled: () => {
          // Reset input to allow re-uploading same file
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        },
      }
    );
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={uploadAttachment.isPending}
      >
        {uploadAttachment.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Upload className="mr-2 h-4 w-4" />
        )}
        Tải lên
      </Button>
    </>
  );
}
