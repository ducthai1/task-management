"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task } from "@/types/database";
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

const taskSchema = z.object({
  title: z.string().min(1, "Tên task là bắt buộc"),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  category: z.string().optional(),
  start_date: z.string().optional(),
  due_date: z.string().optional(),
  estimated_cost: z.coerce.number().min(0).default(0),
  actual_cost: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  defaultValues?: Partial<Task>;
  isLoading?: boolean;
}

const statusOptions = [
  { value: "todo", label: "Cần làm" },
  { value: "in_progress", label: "Đang làm" },
  { value: "done", label: "Hoàn thành" },
];

const priorityOptions = [
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "urgent", label: "Khẩn cấp" },
];

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      description: defaultValues?.description || "",
      status: defaultValues?.status || "todo",
      priority: defaultValues?.priority || "medium",
      category: defaultValues?.category || "",
      start_date: defaultValues?.start_date || "",
      due_date: defaultValues?.due_date || "",
      estimated_cost: defaultValues?.estimated_cost || 0,
      actual_cost: defaultValues?.actual_cost || 0,
      notes: defaultValues?.notes || "",
    },
  });

  const selectedStatus = watch("status");
  const selectedPriority = watch("priority");

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Chỉnh sửa task" : "Tạo task mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin để {defaultValues?.id ? "cập nhật" : "tạo"} task
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder="VD: Đặt cọc nhà hàng"
                {...register("title")}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) =>
                    setValue("status", v as TaskFormData["status"])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Độ ưu tiên</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(v) =>
                    setValue("priority", v as TaskFormData["priority"])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết..."
                {...register("description")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Input
                id="category"
                placeholder="VD: Chuẩn bị, Lễ cưới, ..."
                {...register("category")}
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
                <Label htmlFor="due_date">Hạn hoàn thành</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register("due_date")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Chi phí dự kiến (VND)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  min="0"
                  {...register("estimated_cost")}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_cost">Chi phí thực tế (VND)</Label>
                <Input
                  id="actual_cost"
                  type="number"
                  min="0"
                  {...register("actual_cost")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm..."
                {...register("notes")}
                disabled={isLoading}
              />
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
              {defaultValues?.id ? "Cập nhật" : "Tạo task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
