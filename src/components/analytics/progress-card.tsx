"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  unit?: string;
  variant?: "default" | "success" | "warning" | "danger";
  icon?: React.ReactNode;
}

export function ProgressCard({
  title,
  current,
  total,
  unit = "",
  variant = "default",
  icon,
}: ProgressCardProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const colorClass = {
    default: "text-primary",
    success: "text-green-600",
    warning: "text-yellow-600",
    danger: "text-red-600",
  }[variant];

  const progressColorClass = {
    default: "",
    success: "[&>div]:bg-green-500",
    warning: "[&>div]:bg-yellow-500",
    danger: "[&>div]:bg-red-500",
  }[variant];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className={cn("text-2xl font-bold", colorClass)}>
            {percentage}%
          </span>
          <span className="text-sm text-muted-foreground">
            ({current}/{total} {unit})
          </span>
        </div>
        <Progress value={percentage} className={cn("mt-2", progressColorClass)} />
      </CardContent>
    </Card>
  );
}
