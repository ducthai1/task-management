"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Project } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const projectSchema = z.object({
  name: z.string().min(1, "Tên dự án là bắt buộc"),
  description: z.string().optional(),
  type: z.enum(["wedding", "house", "travel", "event"]),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  defaultValues?: Partial<Project>;
  isLoading?: boolean;
}

const projectTypes = [
  { value: "wedding", label: "Đám cưới" },
  { value: "house", label: "Mua nhà" },
  { value: "travel", label: "Du lịch" },
  { value: "event", label: "Sự kiện" },
];

export function ProjectForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      type: defaultValues?.type || "wedding",
      start_date: defaultValues?.start_date || "",
      end_date: defaultValues?.end_date || "",
    },
  });

  const selectedType = watch("type");

  const handleFormSubmit = async (data: ProjectFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin để {defaultValues?.id ? "cập nhật" : "tạo"} dự án
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên dự án *</Label>
              <Input
                id="name"
                placeholder="VD: Đám cưới Hà Nội 2024"
                {...register("name")}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại dự án *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) =>
                  setValue("type", value as ProjectFormData["type"])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại dự án" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả ngắn về dự án..."
                {...register("description")}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Ngày bắt đầu</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register("start_date")}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Ngày kết thúc</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register("end_date")}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {defaultValues?.id ? "Cập nhật" : "Tạo dự án"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
