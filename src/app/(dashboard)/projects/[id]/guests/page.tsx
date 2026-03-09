"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import {
  useGuests,
  computeGuestStats,
  deriveGuestGroups,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useBulkUpdateRsvp,
} from "@/hooks/use-guests";
import type { Guest } from "@/types/database";
import { GuestForm } from "@/components/guests/guest-form";
import { GuestTable } from "@/components/guests/guest-table";
import { GuestFilters } from "@/components/guests/guest-filters";
import { GuestStats } from "@/components/guests/guest-stats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, ArrowLeft, FileSpreadsheet, Check, X, Clock, ChevronDown } from "lucide-react";

export default function GuestsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: guests, isLoading: guestsLoading } = useGuests(projectId);
  const stats = useMemo(() => computeGuestStats(guests), [guests]);
  const groups = useMemo(() => deriveGuestGroups(guests), [guests]);

  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();
  const bulkUpdateRsvp = useBulkUpdateRsvp();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");

  // Filtered guests
  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter((guest) => {
      const matchesSearch =
        !search ||
        guest.name.toLowerCase().includes(search.toLowerCase()) ||
        guest.phone?.includes(search) ||
        guest.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRsvp =
        rsvpFilter === "all" || guest.rsvp_status === rsvpFilter;

      const matchesGroup =
        groupFilter === "all" || guest.group_name === groupFilter;

      return matchesSearch && matchesRsvp && matchesGroup;
    });
  }, [guests, search, rsvpFilter, groupFilter]);

  const handleCreate = async (data: Partial<Guest>) => {
    await createGuest.mutateAsync({
      ...data,
      project_id: projectId,
    } as Guest);
    setFormOpen(false);
  };

  const handleUpdate = async (data: Partial<Guest>) => {
    if (!editingGuest) return;
    await updateGuest.mutateAsync({
      id: editingGuest.id,
      ...data,
    });
    setEditingGuest(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteGuest.mutateAsync({ id: deleteId, projectId });
    setDeleteId(null);
  };

  const handleUpdateRsvp = async (id: string, status: Guest["rsvp_status"]) => {
    await updateGuest.mutateAsync({ id, rsvp_status: status });
  };

  const handleBulkRsvp = async (status: Guest["rsvp_status"]) => {
    await bulkUpdateRsvp.mutateAsync({
      ids: selectedIds,
      projectId,
      rsvp_status: status,
    });
    setSelectedIds([]);
  };

  const clearFilters = () => {
    setSearch("");
    setRsvpFilter("all");
    setGroupFilter("all");
  };

  // Only show "not found" after loading completes
  if (!projectLoading && !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy dự án</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Always render immediately */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Khách mời - {projectLoading ? <Skeleton className="h-6 w-32 inline-block" /> : project?.name}
          </h1>
          <p className="text-muted-foreground">
            Quản lý danh sách khách mời và RSVP
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/guests/sync`}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Đồng bộ Google Sheets
          </Link>
        </Button>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm khách
        </Button>
      </div>

      {/* Stats - Skeleton only stats cards */}
      {guestsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <GuestStats {...stats} />
      )}

      {/* Filters - Always render */}
      <GuestFilters
        search={search}
        onSearchChange={setSearch}
        rsvpFilter={rsvpFilter}
        onRsvpFilterChange={setRsvpFilter}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        groups={groups || []}
        onClear={clearFilters}
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <span className="text-sm">Đã chọn {selectedIds.length} khách</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Cập nhật RSVP
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkRsvp("confirmed")}>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Xác nhận
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkRsvp("declined")}>
                <X className="mr-2 h-4 w-4 text-red-600" />
                Từ chối
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkRsvp("pending")}>
                <Clock className="mr-2 h-4 w-4" />
                Chờ xác nhận
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
            Bỏ chọn
          </Button>
        </div>
      )}

      {/* Table - Skeleton only table area */}
      {guestsLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <GuestTable
          guests={filteredGuests}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onEdit={setEditingGuest}
          onDelete={setDeleteId}
          onUpdateRsvp={handleUpdateRsvp}
        />
      )}

      {/* Create Form */}
      <GuestForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        existingGroups={groups || []}
        isLoading={createGuest.isPending}
      />

      {/* Edit Form */}
      <GuestForm
        open={!!editingGuest}
        onOpenChange={(open) => !open && setEditingGuest(null)}
        onSubmit={handleUpdate}
        defaultValues={editingGuest || undefined}
        existingGroups={groups || []}
        isLoading={updateGuest.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
