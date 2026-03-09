"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Lock } from "lucide-react";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

function ProfileTab({ userId, email }: { userId: string; email: string }) {
  const { data: profile, isLoading } = useProfile(userId);
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, reset } = useForm<{ full_name: string }>({
    defaultValues: { full_name: "" },
  });

  useEffect(() => {
    if (profile) reset({ full_name: profile.full_name ?? "" });
  }, [profile, reset]);

  const initials = (profile?.full_name ?? email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const onSubmit = (values: { full_name: string }) => {
    updateProfile.mutate({ id: userId, full_name: values.full_name });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Thông tin hồ sơ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={profile?.full_name ?? email} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.full_name ?? "Chưa đặt tên"}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="full_name">Họ và tên</Label>
            <Input id="full_name" {...register("full_name")} placeholder="Nhập họ và tên" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted" />
          </div>
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (values: PasswordFormValues) => {
    await changePassword.mutateAsync({ password: values.newPassword });
    reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Đổi mật khẩu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
            <Input id="currentPassword" type="password" {...register("currentPassword")} placeholder="••••••••" />
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input id="newPassword" type="password" {...register("newPassword")} placeholder="••••••••" />
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
            <Input id="confirmPassword" type="password" {...register("confirmPassword")} placeholder="••••••••" />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" disabled={changePassword.isPending}>
            {changePassword.isPending ? "Đang xử lý..." : "Đổi mật khẩu"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và bảo mật</p>
      </div>
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <ProfileTab userId={user.id} email={user.email ?? ""} />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
