"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { BudgetCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  allocated_amount: z.coerce.number().min(0).default(0),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface BudgetCategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  defaultValues?: Partial<BudgetCategory>;
  isLoading?: boolean;
}

const colorOptions = [
  { value: "#ef4444", label: "Đỏ" },
  { value: "#f97316", label: "Cam" },
  { value: "#eab308", label: "Vàng" },
  { value: "#22c55e", label: "Xanh lá" },
  { value: "#3b82f6", label: "Xanh dương" },
  { value: "#8b5cf6", label: "Tím" },
  { value: "#ec4899", label: "Hồng" },
  { value: "#6b7280", label: "Xám" },
];

export function BudgetCategoryForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isLoading,
}: BudgetCategoryFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      allocated_amount: defaultValues?.allocated_amount || 0,
      color: defaultValues?.color || "#3b82f6",
    },
  });

  const selectedColor = watch("color");

  const handleFormSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Chỉnh sửa danh mục" : "Thêm danh mục ngân sách"}
          </DialogTitle>
          <DialogDescription>
            Tạo danh mục để phân loại chi tiêu
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                placeholder="VD: Nhà hàng, Trang phục..."
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
              <Label htmlFor="allocated_amount">Ngân sách dự kiến (VND)</Label>
              <Input
                id="allocated_amount"
                type="number"
                min="0"
                placeholder="0"
                {...register("allocated_amount")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setValue("color", color.value)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color.value
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
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
              {defaultValues?.id ? "Cập nhật" : "Thêm danh mục"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
