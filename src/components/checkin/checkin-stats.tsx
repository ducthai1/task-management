"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, Clock, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckinStatsProps {
  total: number;
  checkedIn: number;
  confirmed: number;
  totalGiftAmount: number;
}

export function CheckinStats({
  total,
  checkedIn,
  confirmed,
  totalGiftAmount,
}: CheckinStatsProps) {
  const checkinRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;
  const confirmRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

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
            {confirmed} đã xác nhận ({confirmRate}%)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Đã check-in</CardTitle>
          <UserCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{checkedIn}</div>
          <Progress value={checkinRate} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">{checkinRate}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Chờ check-in</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{confirmed - checkedIn}</div>
          <p className="text-xs text-muted-foreground">
            Đã xác nhận, chưa đến
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tổng tiền mừng</CardTitle>
          <Gift className="h-4 w-4 text-pink-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalGiftAmount)}</div>
          <p className="text-xs text-muted-foreground">
            Đã ghi nhận
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
