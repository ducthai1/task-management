import { google } from "googleapis";

export interface SheetRow {
  [key: string]: string | undefined;
}

export async function getGoogleAuth() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT environment variable is not set");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return auth;
}

export async function getSheetData(
  spreadsheetId: string,
  sheetName: string
): Promise<string[][]> {
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
  });

  return response.data.values || [];
}

export async function getSheetNames(spreadsheetId: string): Promise<string[]> {
  const auth = await getGoogleAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return (
    response.data.sheets?.map((s) => s.properties?.title || "Sheet1") || []
  );
}

export function parseSheetRows(
  rows: string[][],
  columnMapping: Record<string, string>
): SheetRow[] {
  if (rows.length < 2) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return dataRows
    .map((row, index) => {
      const obj: SheetRow = {
        external_id: `row_${index + 2}`, // Row number in sheet (1-indexed, +1 for header)
      };

      Object.entries(columnMapping).forEach(([field, columnName]) => {
        const colIndex = headers.findIndex(
          (h) => h.toLowerCase().trim() === columnName.toLowerCase().trim()
        );
        if (colIndex >= 0) {
          obj[field] = row[colIndex]?.trim() || undefined;
        }
      });

      return obj;
    })
    .filter((row) => row.name); // Only include rows with a name
}

export function mapRowToGuest(
  row: SheetRow,
  projectId: string
): {
  project_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  group_name: string | null;
  rsvp_status: "pending" | "confirmed" | "declined";
  rsvp_count: number;
  table_number: string | null;
  notes: string | null;
  source: "google_sheet";
  external_id: string;
} {
  // Parse RSVP status
  let rsvpStatus: "pending" | "confirmed" | "declined" = "pending";
  const rsvpValue = row.rsvp_status?.toLowerCase();
  if (rsvpValue === "confirmed" || rsvpValue === "xác nhận" || rsvpValue === "có") {
    rsvpStatus = "confirmed";
  } else if (rsvpValue === "declined" || rsvpValue === "từ chối" || rsvpValue === "không") {
    rsvpStatus = "declined";
  }

  // Parse RSVP count
  const rsvpCount = parseInt(row.rsvp_count || "1", 10) || 1;

  return {
    project_id: projectId,
    name: row.name || "",
    phone: row.phone || null,
    email: row.email || null,
    group_name: row.group_name || null,
    rsvp_status: rsvpStatus,
    rsvp_count: rsvpCount,
    table_number: row.table_number || null,
    notes: row.notes || null,
    source: "google_sheet",
    external_id: row.external_id || "",
  };
}
