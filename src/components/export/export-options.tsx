"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useProject } from "@/hooks/use-projects";
import { useTasks } from "@/hooks/use-tasks";
import { useGuests } from "@/hooks/use-guests";
import { useBudgetCategories } from "@/hooks/use-budget";
import { ProjectReport, GuestListReport } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Users, Wallet, CheckSquare } from "lucide-react";

interface ExportOptionsProps {
  projectId: string;
}

type ExportType = "project" | "guests" | "budget" | "tasks";

export function ExportOptions({ projectId }: ExportOptionsProps) {
  const { data: project } = useProject(projectId);
  const { data: tasks } = useTasks(projectId);
  const { data: guests } = useGuests(projectId);
  const { data: budgetCategories } = useBudgetCategories(projectId);

  const [loading, setLoading] = useState<ExportType | null>(null);

  const downloadPDF = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type: ExportType) => {
    if (!project) return;

    setLoading(type);

    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case "project":
          blob = await pdf(
            <ProjectReport
              project={project}
              tasks={tasks || []}
              guests={guests || []}
              budgetCategories={budgetCategories || []}
            />
          ).toBlob();
          filename = `${project.name.replace(/\s+/g, "-")}-bao-cao.pdf`;
          break;

        case "guests":
          blob = await pdf(
            <GuestListReport project={project} guests={guests || []} />
          ).toBlob();
          filename = `${project.name.replace(/\s+/g, "-")}-danh-sach-khach.pdf`;
          break;

        case "budget":
          blob = await pdf(
            <ProjectReport
              project={project}
              tasks={tasks || []}
              guests={[]}
              budgetCategories={budgetCategories || []}
            />
          ).toBlob();
          filename = `${project.name.replace(/\s+/g, "-")}-ngan-sach.pdf`;
          break;

        case "tasks":
          blob = await pdf(
            <ProjectReport
              project={project}
              tasks={tasks || []}
              guests={[]}
              budgetCategories={[]}
            />
          ).toBlob();
          filename = `${project.name.replace(/\s+/g, "-")}-cong-viec.pdf`;
          break;

        default:
          return;
      }

      await downloadPDF(blob, filename);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setLoading(null);
    }
  };

  const exportOptions = [
    {
      type: "project" as const,
      title: "Bao cao tong hop",
      description: "Tong quan du an, tasks, ngan sach, khach moi",
      icon: FileText,
    },
    {
      type: "guests" as const,
      title: "Danh sach khach moi",
      description: "Danh sach khach theo nhom voi o check-in",
      icon: Users,
    },
    {
      type: "budget" as const,
      title: "Bao cao ngan sach",
      description: "Chi tiet cac hang muc chi phi",
      icon: Wallet,
    },
    {
      type: "tasks" as const,
      title: "Danh sach cong viec",
      description: "Tat ca tasks voi trang thai va deadline",
      icon: CheckSquare,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {exportOptions.map((option) => {
        const Icon = option.icon;
        const isLoading = loading === option.type;

        return (
          <Card key={option.type} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{option.title}</CardTitle>
                  <CardDescription className="text-xs">
                    {option.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleExport(option.type)}
                disabled={loading !== null}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Dang tao...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Xuat PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
