"use client";

import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
