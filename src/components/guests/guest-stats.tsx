"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, UserX, Clock } from "lucide-react";

interface GuestStatsProps {
  total: number;
  confirmed: number;
  declined: number;
  pending: number;
  totalRsvpCount: number;
}

export function GuestStats({
  total,
  confirmed,
  declined,
  pending,
  totalRsvpCount,
}: GuestStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng khách</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{total}</div>
          <p className="text-xs text-muted-foreground">
            {totalRsvpCount} người tham dự
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Xác nhận</CardTitle>
          <UserCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{confirmed}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? Math.round((confirmed / total) * 100) : 0}% tổng khách
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chờ xác nhận</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{pending}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? Math.round((pending / total) * 100) : 0}% tổng khách
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
          <UserX className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{declined}</div>
          <p className="text-xs text-muted-foreground">
            {total > 0 ? Math.round((declined / total) * 100) : 0}% tổng khách
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
