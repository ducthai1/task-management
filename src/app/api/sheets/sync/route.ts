import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSheetData, parseSheetRows, mapRowToGuest } from "@/lib/google-sheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, spreadsheetId, sheetName, columnMapping } = body;

    if (!projectId || !spreadsheetId || !sheetName || !columnMapping) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns the project
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .single<{ id: string; owner_id: string }>();

    if (!project || project.owner_id !== user.id) {
      return NextResponse.json(
        { message: "Project not found or unauthorized" },
        { status: 403 }
      );
    }

    // Fetch data from Google Sheet
    const rows = await getSheetData(spreadsheetId, sheetName);

    if (rows.length < 2) {
      return NextResponse.json(
        { message: "Sheet is empty or has no data rows" },
        { status: 400 }
      );
    }

    // Parse rows using column mapping
    const parsedRows = parseSheetRows(rows, columnMapping);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { message: "No valid data rows found" },
        { status: 400 }
      );
    }

    // Map to guest format
    const guests = parsedRows.map((row) => mapRowToGuest(row, projectId));

    // Upsert guests (update if external_id exists, insert otherwise)
    let synced = 0;
    const errors: string[] = [];

    for (const guest of guests) {
      // Check if guest with this external_id exists
      const { data: existing } = await supabase
        .from("guests")
        .select("id")
        .eq("project_id", projectId)
        .eq("external_id", guest.external_id)
        .single<{ id: string }>();

      if (existing) {
        // Update
        const { error } = await supabase
          .from("guests")
          .update({
            name: guest.name,
            phone: guest.phone,
            email: guest.email,
            group_name: guest.group_name,
            rsvp_status: guest.rsvp_status,
            rsvp_count: guest.rsvp_count,
            table_number: guest.table_number,
            notes: guest.notes,
          } as never)
          .eq("id", existing.id);

        if (error) {
          errors.push(`Update failed for ${guest.name}: ${error.message}`);
        } else {
          synced++;
        }
      } else {
        // Insert
        const { error } = await supabase
          .from("guests")
          .insert(guest as never);

        if (error) {
          errors.push(`Insert failed for ${guest.name}: ${error.message}`);
        } else {
          synced++;
        }
      }
    }

    // Log sync result
    await supabase.from("sync_logs").insert({
      project_id: projectId,
      source_type: "google_sheet",
      source_id: spreadsheetId,
      records_synced: synced,
      status: errors.length === 0 ? "success" : errors.length < guests.length ? "partial" : "failed",
      error_message: errors.length > 0 ? errors.join("; ") : null,
    } as never);

    return NextResponse.json({
      synced,
      total: guests.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
