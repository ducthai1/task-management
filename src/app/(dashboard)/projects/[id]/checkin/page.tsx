"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useProject } from "@/hooks/use-projects";
import { useGuests, useUpdateGuest, useGuestStats } from "@/hooks/use-guests";
import type { Guest } from "@/types/database";
import { CheckinStats } from "@/components/checkin/checkin-stats";
import { QRDisplay } from "@/components/checkin/qr-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Search,
  UserCheck,
  QrCode,
  Clock,
  Gift,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: guests, isLoading: guestsLoading } = useGuests(projectId);
  const stats = useGuestStats(projectId);
  const updateGuest = useUpdateGuest();

  const [search, setSearch] = useState("");
  const [qrGuest, setQrGuest] = useState<Guest | null>(null);
  const [giftDialogGuest, setGiftDialogGuest] = useState<Guest | null>(null);
  const [giftAmount, setGiftAmount] = useState("");

  // Filter guests for check-in (only confirmed)
  const checkinGuests = useMemo(() => {
    if (!guests) return [];
    return guests
      .filter((g) => g.rsvp_status === "confirmed")
      .filter(
        (g) =>
          !search ||
          g.name.toLowerCase().includes(search.toLowerCase()) ||
          g.phone?.includes(search) ||
          g.table_number?.includes(search)
      );
  }, [guests, search]);

  const totalGiftAmount = useMemo(() => {
    if (!guests) return 0;
    return guests.reduce((sum, g) => sum + (g.gift_amount || 0), 0);
  }, [guests]);

  const handleCheckin = async (guest: Guest) => {
    await updateGuest.mutateAsync({
      id: guest.id,
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    });
  };

  const handleUncheckin = async (guest: Guest) => {
    await updateGuest.mutateAsync({
      id: guest.id,
      checked_in: false,
      checked_in_at: null,
    });
  };

  const handleSaveGift = async () => {
    if (!giftDialogGuest) return;
    await updateGuest.mutateAsync({
      id: giftDialogGuest.id,
      gift_amount: parseFloat(giftAmount) || null,
    });
    setGiftDialogGuest(null);
    setGiftAmount("");
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
          <Link href={`/projects/${projectId}/guests`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Check-in - {projectLoading ? <Skeleton className="h-6 w-32 inline-block" /> : project?.name}
          </h1>
          <p className="text-muted-foreground">
            Quét mã QR hoặc tìm kiếm để check-in khách
          </p>
        </div>
      </div>

      {/* Stats - Skeleton only for stats */}
      {guestsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <CheckinStats
          total={stats.total}
          checkedIn={stats.checkedIn}
          confirmed={stats.confirmed}
          totalGiftAmount={totalGiftAmount}
        />
      )}

      {/* Search - Always render */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tìm kiếm khách</CardTitle>
          <CardDescription>
            Nhập tên, số điện thoại hoặc số bàn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest List - Skeleton only for table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách khách đã xác nhận</CardTitle>
          <CardDescription>
            {guestsLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${checkinGuests.length} khách (${stats.checkedIn} đã check-in)`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {guestsLoading ? (
            <Skeleton className="h-64" />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khách</TableHead>
                    <TableHead>Bàn</TableHead>
                    <TableHead>Số người</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tiền mừng</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkinGuests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <p className="text-muted-foreground">
                          {search
                            ? "Không tìm thấy khách"
                            : "Chưa có khách xác nhận"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    checkinGuests.map((guest) => (
                      <TableRow key={guest.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{guest.name}</p>
                            {guest.phone && (
                              <p className="text-xs text-muted-foreground">
                                {guest.phone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{guest.table_number || "-"}</TableCell>
                        <TableCell>{guest.rsvp_count}</TableCell>
                        <TableCell>
                          {guest.checked_in ? (
                            <div className="flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="mr-1 h-3 w-3" />
                                Đã đến
                              </Badge>
                              {guest.checked_in_at && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(guest.checked_in_at)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Chưa đến
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setGiftDialogGuest(guest);
                              setGiftAmount(guest.gift_amount?.toString() || "");
                            }}
                            className="gap-1"
                          >
                            <Gift className="h-3 w-3" />
                            {guest.gift_amount
                              ? `${(guest.gift_amount / 1000000).toFixed(1)}M`
                              : "-"}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setQrGuest(guest)}
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            {guest.checked_in ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUncheckin(guest)}
                              >
                                Hủy check-in
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleCheckin(guest)}
                              >
                                <UserCheck className="mr-1 h-4 w-4" />
                                Check-in
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Dialog */}
      <Dialog open={!!qrGuest} onOpenChange={() => setQrGuest(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Mã QR Check-in</DialogTitle>
          </DialogHeader>
          {qrGuest && (
            <div className="flex justify-center">
              <QRDisplay guestId={qrGuest.id} guestName={qrGuest.name} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Gift Amount Dialog */}
      <Dialog
        open={!!giftDialogGuest}
        onOpenChange={() => setGiftDialogGuest(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Ghi nhận tiền mừng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Khách: <strong>{giftDialogGuest?.name}</strong>
            </p>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="Số tiền (VND)"
                value={giftAmount}
                onChange={(e) => setGiftAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ví dụ: 500000 = 500,000đ
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setGiftDialogGuest(null)}
              >
                Hủy
              </Button>
              <Button onClick={handleSaveGift}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
