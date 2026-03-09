"use client";

import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { Project } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  Home,
  Plane,
  PartyPopper,
  MoreVertical,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";

const projectTypeConfig = {
  wedding: { icon: Heart, label: "Đám cưới", bgColor: "bg-pink-500", textColor: "text-pink-500" },
  house: { icon: Home, label: "Mua nhà", bgColor: "bg-blue-500", textColor: "text-blue-500" },
  travel: { icon: Plane, label: "Du lịch", bgColor: "bg-green-500", textColor: "text-green-500" },
  event: { icon: PartyPopper, label: "Sự kiện", bgColor: "bg-purple-500", textColor: "text-purple-500" },
};

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const config = projectTypeConfig[project.type];
  const Icon = config.icon;

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      <div className={`absolute top-0 left-0 w-1 h-full ${config.bgColor}`} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${config.bgColor} bg-opacity-10 ${config.textColor}`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                <Pencil className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Xóa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-lg mt-2">
          <Link
            href={`/projects/${project.id}`}
            className="hover:text-primary transition-colors"
          >
            {project.name}
          </Link>
        </CardTitle>
        {project.description && (
          <CardDescription className="line-clamp-2">
            {project.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {(project.start_date || project.end_date) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {project.start_date && (
              <span>
                {format(new Date(project.start_date), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            )}
            {project.start_date && project.end_date && <span>-</span>}
            {project.end_date && (
              <span>
                {format(new Date(project.end_date), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
