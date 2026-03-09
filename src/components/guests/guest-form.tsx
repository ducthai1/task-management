"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Guest } from "@/types/database";
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

const guestSchema = z.object({
  name: z.string().min(1, "Tên khách là bắt buộc"),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  group_name: z.string().optional(),
  rsvp_status: z.enum(["pending", "confirmed", "declined"]).default("pending"),
  rsvp_count: z.coerce.number().min(1).default(1),
  table_number: z.string().optional(),
  notes: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestSchema>;

interface GuestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: GuestFormData) => Promise<void>;
  defaultValues?: Partial<Guest>;
  existingGroups?: string[];
  isLoading?: boolean;
}

export function GuestForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  existingGroups = [],
  isLoading,
}: GuestFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GuestFormData>({
    resolver: zodResolver(guestSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      group_name: defaultValues?.group_name || "",
      rsvp_status: defaultValues?.rsvp_status || "pending",
      rsvp_count: defaultValues?.rsvp_count || 1,
      table_number: defaultValues?.table_number || "",
      notes: defaultValues?.notes || "",
    },
  });

  const selectedStatus = watch("rsvp_status");

  const handleFormSubmit = async (data: GuestFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues?.id ? "Chỉnh sửa khách" : "Thêm khách mới"}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin khách mời
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên khách *</Label>
                <Input
                  id="name"
                  placeholder="Nguyễn Văn A"
                  {...register("name")}
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  placeholder="0901234567"
                  {...register("phone")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="group_name">Nhóm</Label>
                <Input
                  id="group_name"
                  placeholder="VD: Bạn đại học, Họ hàng..."
                  list="group-suggestions"
                  {...register("group_name")}
                  disabled={isLoading}
                />
                <datalist id="group-suggestions">
                  {existingGroups.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Trạng thái RSVP</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(v) => setValue("rsvp_status", v as GuestFormData["rsvp_status"])}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="confirmed">Xác nhận</SelectItem>
                    <SelectItem value="declined">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvp_count">Số người</Label>
                <Input
                  id="rsvp_count"
                  type="number"
                  min="1"
                  {...register("rsvp_count")}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="table_number">Số bàn</Label>
                <Input
                  id="table_number"
                  placeholder="VD: A1, B2..."
                  {...register("table_number")}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm về khách..."
                rows={2}
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
              {defaultValues?.id ? "Cập nhật" : "Thêm khách"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
