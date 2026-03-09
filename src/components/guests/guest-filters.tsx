"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface GuestFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  rsvpFilter: string;
  onRsvpFilterChange: (value: string) => void;
  groupFilter: string;
  onGroupFilterChange: (value: string) => void;
  groups: string[];
  onClear: () => void;
}

export function GuestFilters({
  search,
  onSearchChange,
  rsvpFilter,
  onRsvpFilterChange,
  groupFilter,
  onGroupFilterChange,
  groups,
  onClear,
}: GuestFiltersProps) {
  const hasFilters = search || rsvpFilter !== "all" || groupFilter !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên, SĐT, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={rsvpFilter} onValueChange={onRsvpFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả RSVP</SelectItem>
          <SelectItem value="pending">Chờ xác nhận</SelectItem>
          <SelectItem value="confirmed">Đã xác nhận</SelectItem>
          <SelectItem value="declined">Từ chối</SelectItem>
        </SelectContent>
      </Select>

      <Select value={groupFilter} onValueChange={onGroupFilterChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Nhóm" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả nhóm</SelectItem>
          {groups.map((group) => (
            <SelectItem key={group} value={group}>
              {group}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
