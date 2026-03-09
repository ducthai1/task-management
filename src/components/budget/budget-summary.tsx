"use client";

import type { BudgetCategory, Task } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { MoreVertical, Pencil, Trash2, Wallet, TrendingUp, TrendingDown } from "lucide-react";

interface BudgetSummaryProps {
  categories: BudgetCategory[];
  tasks: Task[];
  onEditCategory?: (category: BudgetCategory) => void;
  onDeleteCategory?: (id: string) => void;
}

export function BudgetSummary({
  categories,
  tasks,
  onEditCategory,
  onDeleteCategory,
}: BudgetSummaryProps) {
  // Calculate totals
  const totalAllocated = categories.reduce(
    (sum, c) => sum + c.allocated_amount,
    0
  );
  const totalActual = tasks.reduce((sum, t) => sum + t.actual_cost, 0);

  // Calculate per category
  const categoryStats = categories.map((category) => {
    const categoryTasks = tasks.filter((t) => t.category === category.name);
    const estimated = categoryTasks.reduce(
      (sum, t) => sum + t.estimated_cost,
      0
    );
    const actual = categoryTasks.reduce((sum, t) => sum + t.actual_cost, 0);
    const percentage =
      category.allocated_amount > 0
        ? Math.round((actual / category.allocated_amount) * 100)
        : 0;

    return {
      ...category,
      estimated,
      actual,
      percentage,
      isOverBudget: actual > category.allocated_amount,
    };
  });

  const variance = totalAllocated - totalActual;
  const isUnderBudget = variance >= 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ngân sách</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalAllocated)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng ngân sách dự kiến
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã chi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalActual)}
            </div>
            <p className="text-xs text-muted-foreground">
              Chi phí thực tế
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chênh lệch</CardTitle>
            {isUnderBudget ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isUnderBudget ? "text-green-600" : "text-red-600"
              }`}
            >
              {isUnderBudget ? "+" : "-"}
              {formatCurrency(Math.abs(variance))}
            </div>
            <p className="text-xs text-muted-foreground">
              {isUnderBudget ? "Còn dư" : "Vượt ngân sách"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        <h3 className="font-semibold">Danh mục chi tiêu</h3>
        {categoryStats.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Chưa có danh mục nào. Thêm danh mục để theo dõi chi tiêu.
          </p>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((category) => (
              <Card key={category.id} className="overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  <div
                    className="w-3 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: category.color || "#6b7280" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium truncate">{category.name}</h4>
                      <div className="flex items-center gap-2">
                        {category.isOverBudget && (
                          <Badge variant="destructive" className="text-xs">
                            Vượt
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onEditCategory?.(category)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteCategory?.(category.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {formatCurrency(category.actual)} /{" "}
                        {formatCurrency(category.allocated_amount)}
                      </span>
                      <span className="text-muted-foreground">
                        ({category.percentage}%)
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          category.isOverBudget ? "bg-red-500" : "bg-primary"
                        }`}
                        style={{
                          width: `${Math.min(category.percentage, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
