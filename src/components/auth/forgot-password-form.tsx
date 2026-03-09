"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, { redirectTo });

    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    setSent(true);
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Quên mật khẩu</CardTitle>
        <CardDescription className="text-center">
          Nhập email để nhận link khôi phục mật khẩu
        </CardDescription>
      </CardHeader>
      {sent ? (
        <CardContent>
          <p className="text-sm text-center text-muted-foreground">
            Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.
          </p>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gửi email khôi phục
            </Button>
          </CardFooter>
        </form>
      )}
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}
