import QRCode from "qrcode";

/**
 * Generate a QR code data URL for a guest
 * @param guestId - The unique guest ID
 * @returns Data URL string for the QR code image
 */
export async function generateGuestQR(guestId: string): Promise<string> {
  // The QR contains just the guest ID for simplicity
  // The check-in page will use this ID to look up and check in the guest
  const data = guestId;

  return await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate a unique QR code string for storing in DB
 * @returns Unique QR code string
 */
export function generateQRCodeString(): string {
  return `QR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
