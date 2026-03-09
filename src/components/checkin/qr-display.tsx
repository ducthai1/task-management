"use client";

import { useState, useEffect } from "react";
import { generateGuestQR } from "@/lib/qr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, QrCode } from "lucide-react";

interface QRDisplayProps {
  guestId: string;
  guestName: string;
}

export function QRDisplay({ guestId, guestName }: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateGuestQR(guestId)
      .then(setQrDataUrl)
      .finally(() => setLoading(false));
  }, [guestId]);

  const handleDownload = () => {
    if (!qrDataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-${guestName.replace(/\s+/g, "-")}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          QR Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {loading ? (
          <Skeleton className="h-[200px] w-[200px]" />
        ) : qrDataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`QR Code for ${guestName}`}
              className="w-[200px] h-[200px]"
            />
            <p className="text-sm text-muted-foreground text-center">
              {guestName}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Tải QR
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Không thể tạo mã QR
          </p>
        )}
      </CardContent>
    </Card>
  );
}
