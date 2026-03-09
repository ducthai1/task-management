"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectError({ error, reset }: ErrorProps) {
  return (
    <div className="flex h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Không thể tải dự án
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message ?? "Đã xảy ra lỗi khi tải dự án. Vui lòng thử lại."}
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects">Quay lại</Link>
          </Button>
          <Button onClick={reset}>Thử lại</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
