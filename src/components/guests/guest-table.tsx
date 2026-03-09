"use client";

import type { Guest } from "@/types/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, Pencil, Trash2, Check, X, Clock } from "lucide-react";

interface GuestTableProps {
  guests: Guest[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => void;
  onUpdateRsvp: (id: string, status: Guest["rsvp_status"]) => void;
}

const rsvpConfig = {
  pending: { label: "Chờ", variant: "secondary" as const, icon: Clock },
  confirmed: { label: "Xác nhận", variant: "default" as const, icon: Check },
  declined: { label: "Từ chối", variant: "destructive" as const, icon: X },
};

export function GuestTable({
  guests,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onUpdateRsvp,
}: GuestTableProps) {
  const allSelected = guests.length > 0 && selectedIds.length === guests.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < guests.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(guests.map((g) => g.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (guests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Chưa có khách nào. Thêm khách mới hoặc đồng bộ từ Google Sheets.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) (el as HTMLInputElement).indeterminate = someSelected;
                }}
                onCheckedChange={toggleAll}
              />
            </TableHead>
            <TableHead>Tên khách</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Nhóm</TableHead>
            <TableHead>RSVP</TableHead>
            <TableHead className="text-center">Số người</TableHead>
            <TableHead>Bàn</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => {
            const config = rsvpConfig[guest.rsvp_status];
            const Icon = config.icon;
            return (
              <TableRow key={guest.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(guest.id)}
                    onCheckedChange={() => toggleOne(guest.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {guest.phone && <div>{guest.phone}</div>}
                    {guest.email && (
                      <div className="text-muted-foreground">{guest.email}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {guest.group_name && (
                    <Badge variant="outline">{guest.group_name}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant}>
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{guest.rsvp_count}</TableCell>
                <TableCell>{guest.table_number || "-"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(guest)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onUpdateRsvp(guest.id, "confirmed")}
                        disabled={guest.rsvp_status === "confirmed"}
                      >
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Xác nhận
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUpdateRsvp(guest.id, "declined")}
                        disabled={guest.rsvp_status === "declined"}
                      >
                        <X className="mr-2 h-4 w-4 text-red-600" />
                        Từ chối
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUpdateRsvp(guest.id, "pending")}
                        disabled={guest.rsvp_status === "pending"}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Chờ xác nhận
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDelete(guest.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
