"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Project, Task, Guest, BudgetCategory } from "@/types/database";

// Register Vietnamese font (optional - fallback to default)
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#3b82f6",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e40af",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#374151",
    backgroundColor: "#f3f4f6",
    padding: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#374151",
    paddingVertical: 6,
    backgroundColor: "#f9fafb",
  },
  cell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  cellSmall: {
    width: 60,
    paddingHorizontal: 4,
  },
  cellMedium: {
    width: 80,
    paddingHorizontal: 4,
  },
  cellLarge: {
    flex: 2,
    paddingHorizontal: 4,
  },
  bold: {
    fontWeight: "bold",
  },
  text: {
    fontSize: 10,
  },
  smallText: {
    fontSize: 8,
    color: "#6b7280",
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    padding: 10,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#6b7280",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
  },
  badgeTodo: {
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  badgeInProgress: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  badgeDone: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
});

interface ProjectReportProps {
  project: Project;
  tasks: Task[];
  guests: Guest[];
  budgetCategories: BudgetCategory[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("vi-VN");
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "done":
      return styles.badgeDone;
    case "in_progress":
      return styles.badgeInProgress;
    default:
      return styles.badgeTodo;
  }
};

const statusLabels: Record<string, string> = {
  todo: "Can lam",
  in_progress: "Dang lam",
  done: "Hoan thanh",
};

export function ProjectReport({
  project,
  tasks,
  guests,
  budgetCategories,
}: ProjectReportProps) {
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  const totalBudget = budgetCategories.reduce(
    (sum, c) => sum + c.allocated_amount,
    0
  );
  const totalSpent = tasks.reduce((sum, t) => sum + t.actual_cost, 0);

  const confirmedGuests = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const totalGuests = guests.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{project.name}</Text>
          <Text style={styles.subtitle}>
            Bao cao du an - {new Date().toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{tasks.length}</Text>
            <Text style={styles.summaryLabel}>Tong task</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{doneCount}</Text>
            <Text style={styles.summaryLabel}>Hoan thanh</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{confirmedGuests}/{totalGuests}</Text>
            <Text style={styles.summaryLabel}>Khach xac nhan</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%
            </Text>
            <Text style={styles.summaryLabel}>Chi tieu</Text>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Danh sach cong viec ({todoCount} can lam, {inProgressCount} dang lam, {doneCount} hoan thanh)
          </Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellLarge, styles.bold]}>Tieu de</Text>
            <Text style={[styles.cellMedium, styles.bold]}>Trang thai</Text>
            <Text style={[styles.cellMedium, styles.bold]}>Han</Text>
            <Text style={[styles.cellMedium, styles.bold]}>Chi phi</Text>
          </View>
          {tasks.map((task) => (
            <View key={task.id} style={styles.row}>
              <Text style={styles.cellLarge}>{task.title}</Text>
              <View style={styles.cellMedium}>
                <Text style={[styles.badge, getStatusStyle(task.status)]}>
                  {statusLabels[task.status] || task.status}
                </Text>
              </View>
              <Text style={styles.cellMedium}>{formatDate(task.due_date)}</Text>
              <Text style={styles.cellMedium}>
                {task.actual_cost > 0 ? formatCurrency(task.actual_cost) : "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Budget Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Ngan sach (Tong: {formatCurrency(totalBudget)} | Da chi: {formatCurrency(totalSpent)})
          </Text>
          <View style={styles.headerRow}>
            <Text style={[styles.cellLarge, styles.bold]}>Hang muc</Text>
            <Text style={[styles.cellMedium, styles.bold]}>Du tru</Text>
            <Text style={[styles.cellMedium, styles.bold]}>Thuc chi</Text>
          </View>
          {budgetCategories.map((category) => {
            const categorySpent = tasks
              .filter((t) => t.category === category.name)
              .reduce((sum, t) => sum + t.actual_cost, 0);
            return (
              <View key={category.id} style={styles.row}>
                <Text style={styles.cellLarge}>{category.name}</Text>
                <Text style={styles.cellMedium}>
                  {formatCurrency(category.allocated_amount)}
                </Text>
                <Text style={styles.cellMedium}>{formatCurrency(categorySpent)}</Text>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Tao boi Task Management System | {new Date().toLocaleString("vi-VN")}
        </Text>
      </Page>
    </Document>
  );
}
