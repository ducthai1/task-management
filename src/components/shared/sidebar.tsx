"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  ChevronLeft,
  Heart,
  Home,
  Plane,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Dự án", href: "/projects", icon: FolderKanban },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

const projectTypes = [
  { type: "wedding", icon: Heart, label: "Đám cưới" },
  { type: "house", icon: Home, label: "Mua nhà" },
  { type: "travel", icon: Plane, label: "Du lịch" },
  { type: "event", icon: PartyPopper, label: "Sự kiện" },
];

function SidebarComponent() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link href="/" className="flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">TaskMgr</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!sidebarOpen && "mx-auto")}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !sidebarOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  !sidebarOpen && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Project Types */}
          {sidebarOpen && (
            <div className="pt-4">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Loại dự án
              </p>
              <div className="mt-2 space-y-1">
                {projectTypes.map((type) => (
                  <div
                    key={type.type}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground"
                  >
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

// Prevent unnecessary re-renders
export const Sidebar = memo(SidebarComponent);
