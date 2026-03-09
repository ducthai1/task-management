"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInviteMember } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const inviteSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  role: z.enum(["editor", "viewer"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function InviteForm({ open, onOpenChange, projectId }: InviteFormProps) {
  const inviteMember = useInviteMember();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "viewer",
    },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: InviteFormData) => {
    await inviteMember.mutateAsync({
      project_id: projectId,
      invited_email: data.email,
      role: data.role,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Mời thành viên</DialogTitle>
          <DialogDescription>
            Mời người khác tham gia cộng tác trong dự án này
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                {...register("email")}
                disabled={inviteMember.isPending}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Quyền</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setValue("role", v as "editor" | "viewer")}
                disabled={inviteMember.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-xs text-muted-foreground">
                        Có thể xem và chỉnh sửa
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div>
                      <div className="font-medium">Viewer</div>
                      <div className="text-xs text-muted-foreground">
                        Chỉ có thể xem
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={inviteMember.isPending}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={inviteMember.isPending}>
              {inviteMember.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
