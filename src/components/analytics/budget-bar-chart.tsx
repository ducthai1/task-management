"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface BudgetBarChartProps {
  data: Array<{
    name: string;
    estimated: number;
    actual: number;
  }>;
  title?: string;
}

export function BudgetBarChart({
  data,
  title = "Dự toán vs Thực tế",
}: BudgetBarChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chưa có dữ liệu ngân sách
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for shorter labels
  const formattedData = data.map((item) => ({
    ...item,
    shortName:
      item.name.length > 10 ? item.name.substring(0, 10) + "..." : item.name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData} layout="vertical">
            <XAxis
              type="number"
              tickFormatter={(value) =>
                value >= 1000000 ? `${value / 1000000}M` : `${value / 1000}K`
              }
            />
            <YAxis
              dataKey="shortName"
              type="category"
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar
              dataKey="estimated"
              name="Dự toán"
              fill="#3b82f6"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="actual"
              name="Thực tế"
              fill="#22c55e"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
