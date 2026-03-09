import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FolderX } from "lucide-react";

export default function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <FolderX className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Không tìm thấy dự án</h2>
      <p className="text-muted-foreground">
        Dự án này không tồn tại hoặc bạn không có quyền truy cập.
      </p>
      <Button asChild>
        <Link href="/projects">Quay lại danh sách dự án</Link>
      </Button>
    </div>
  );
}
