import { type NextRequest, NextResponse } from "next/server";
import { failure, requireToken } from "@/lib/security";
import { checked, database } from "@/lib/supabase";
export async function POST(request: NextRequest) {
  try {
    requireToken(request, "MAINTENANCE_TOKEN");
    const db = database(),
      cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
    checked(await db.from("messages").delete().lt("created_at", cutoff));
    checked(await db.from("conversations").delete().lt("updated_at", cutoff));
    checked(
      await db
        .from("webhook_events")
        .delete()
        .lt("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    );
    checked(
      await db
        .from("rate_limits")
        .delete()
        .lt("window_start", new Date(Date.now() - 86400000).toISOString()),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
