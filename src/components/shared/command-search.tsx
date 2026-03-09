"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Search, FolderKanban, CheckSquare, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useProjects } from "@/hooks/use-projects";
import { useAllTasks } from "@/hooks/use-tasks";
import type { Project, Task } from "@/types/database";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "project" | "task";
  title: string;
  subtitle?: string;
  href: string;
}

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  // Prefetch data so it's in cache when dialog opens
  useProjects();
  useAllTasks();

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery.trim()) return [];

    const q = debouncedQuery.toLowerCase();

    const projects = queryClient.getQueryData<Project[]>(["projects"]) ?? [];
    const tasks = queryClient.getQueryData<Task[]>(["tasks", "all"]) ?? [];

    const projectResults: SearchResult[] = projects
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        type: "project",
        title: p.name,
        subtitle: p.type,
        href: `/projects/${p.id}`,
      }));

    const taskResults: SearchResult[] = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        type: "task",
        title: t.title,
        subtitle: t.status.replace("_", " "),
        href: `/projects/${t.project_id}?task=${t.id}`,
      }));

    return [...projectResults, ...taskResults];
  }, [debouncedQuery, queryClient]);

  const projectResults = results.filter((r) => r.type === "project");
  const taskResults = results.filter((r) => r.type === "task");

  const handleSelect = useCallback(
    (href: string) => {
      router.push(href);
      setOpen(false);
    },
    [router]
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Tìm kiếm...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Tìm kiếm toàn cục</DialogTitle>

          {/* Search input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm dự án, task..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none h-12 text-sm"
            />
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {!debouncedQuery.trim() && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nhập từ khóa để tìm kiếm...
              </p>
            )}

            {debouncedQuery.trim() && results.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Không tìm thấy kết quả nào.
              </p>
            )}

            {projectResults.length > 0 && (
              <ResultSection
                title="Dự án"
                icon={<FolderKanban className="h-3.5 w-3.5" />}
                results={projectResults}
                onSelect={handleSelect}
              />
            )}

            {taskResults.length > 0 && (
              <ResultSection
                title="Công việc"
                icon={<CheckSquare className="h-3.5 w-3.5" />}
                results={taskResults}
                onSelect={handleSelect}
              />
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2 flex justify-end">
            <span className="text-xs text-muted-foreground">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">ESC</kbd>
              {" "}để đóng
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ResultSectionProps {
  title: string;
  icon: React.ReactNode;
  results: SearchResult[];
  onSelect: (href: string) => void;
}

function ResultSection({ title, icon, results, onSelect }: ResultSectionProps) {
  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onSelect(result.href)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm",
            "hover:bg-accent hover:text-accent-foreground transition-colors text-left"
          )}
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{result.title}</p>
            {result.subtitle && (
              <p className="truncate text-xs text-muted-foreground capitalize">
                {result.subtitle}
              </p>
            )}
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-2" />
        </button>
      ))}
    </div>
  );
}
