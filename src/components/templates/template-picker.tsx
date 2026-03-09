"use client";

import { useState } from "react";
import { useTemplates, useApplyTemplate } from "@/hooks/use-templates";
import type { Template, TemplateTask, TemplateBudgetCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Heart, Home, Plane, PartyPopper, CheckCircle2, Wallet } from "lucide-react";

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectType: string;
}

const typeIcons = {
  wedding: Heart,
  house: Home,
  travel: Plane,
  event: PartyPopper,
};

const typeColors = {
  wedding: "text-pink-500",
  house: "text-blue-500",
  travel: "text-green-500",
  event: "text-purple-500",
};

export function TemplatePicker({
  open,
  onOpenChange,
  projectId,
  projectType,
}: TemplatePickerProps) {
  const { data: templates, isLoading } = useTemplates(projectType);
  const applyTemplate = useApplyTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const handleApply = async () => {
    if (!selectedTemplate) return;
    await applyTemplate.mutateAsync({
      projectId,
      templateId: selectedTemplate.id,
    });
    setShowPreview(false);
    setSelectedTemplate(null);
    onOpenChange(false);
  };

  const Icon = typeIcons[projectType as keyof typeof typeIcons] || PartyPopper;
  const color = typeColors[projectType as keyof typeof typeColors] || "text-purple-500";

  if (showPreview && selectedTemplate) {
    const tasks = (selectedTemplate.tasks as unknown as TemplateTask[]) || [];
    const categories = (selectedTemplate.budget_categories as unknown as TemplateBudgetCategory[]) || [];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              {selectedTemplate.name}
            </DialogTitle>
            <DialogDescription>{selectedTemplate.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {/* Tasks Preview */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {tasks.length} công việc
              </h4>
              <div className="space-y-1">
                {tasks.slice(0, 10).map((task, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted">
                    <span className="flex-1">{task.title}</span>
                    {task.category && (
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    )}
                  </div>
                ))}
                {tasks.length > 10 && (
                  <p className="text-sm text-muted-foreground">
                    + {tasks.length - 10} công việc khác
                  </p>
                )}
              </div>
            </div>

            {/* Budget Categories Preview */}
            {categories.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  {categories.length} danh mục ngân sách
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, i) => (
                    <Badge key={i} variant="secondary">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Quay lại
            </Button>
            <Button onClick={handleApply} disabled={applyTemplate.isPending}>
              {applyTemplate.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Áp dụng template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Chọn Template</DialogTitle>
          <DialogDescription>
            Chọn một template để thêm các công việc và danh mục ngân sách vào dự án
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !templates || templates.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Chưa có template cho loại dự án này
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => {
              const tasks = (template.tasks as unknown as TemplateTask[]) || [];
              const categories = (template.budget_categories as unknown as TemplateBudgetCategory[]) || [];
              const TemplateIcon = typeIcons[template.type as keyof typeof typeIcons] || PartyPopper;
              const templateColor = typeColors[template.type as keyof typeof typeColors] || "text-purple-500";

              return (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelect(template)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TemplateIcon className={`h-4 w-4 ${templateColor}`} />
                      {template.name}
                      {template.is_system && (
                        <Badge variant="secondary" className="text-xs">
                          Hệ thống
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{tasks.length} công việc</span>
                      <span>{categories.length} danh mục</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
