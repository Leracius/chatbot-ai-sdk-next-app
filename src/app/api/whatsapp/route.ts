import { type NextRequest, NextResponse } from "next/server";
import { processChatMessage } from "@/lib/chat-service";
import {
  failure,
  HttpError,
  jsonBody,
  rateLimit,
  requireToken,
} from "@/lib/security";
import { checked, database } from "@/lib/supabase";
import { whatsappSchema } from "@/lib/validation";
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
export async function POST(request: NextRequest) {
  try {
    requireToken(request, "WHATSAPP_WEBHOOK_TOKEN");
    await rateLimit("whatsapp:global", 200);
    const body = await jsonBody(request);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new HttpError(400, "Evento inválido.");
    if (body.event !== "messages.upsert")
      return NextResponse.json({ ignored: true });
    const parsed = whatsappSchema.safeParse(body);
    if (!parsed.success) throw new HttpError(400, "Evento inválido.");
    const { data, instance } = parsed.data;
    if (instance !== process.env.WHATSAPP_INSTANCE_NAME)
      throw new HttpError(403, "Instancia inválida.");
    if (data.key.fromMe) return NextResponse.json({ ignored: true });
    const text = (
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      ""
    ).trim();
    if (!text) return NextResponse.json({ ignored: true });
    const base = process.env.WHATSAPP_API_URL,
      key = process.env.WHATSAPP_API_KEY;
    if (!base || !key || !instance)
      throw new HttpError(503, "Canal no configurado.");
    const db = database();
    const eventId = `${instance}:${data.key.id}`;
    const { error } = await db.from("webhook_events").insert({
      id: eventId,
      sender: data.key.remoteJid,
      status: "processing",
    });
    if (error) {
      if (error.code !== "23505") throw new Error("Event store failed");
      const existing = checked(
        await db
          .from("webhook_events")
          .select("status")
          .eq("id", eventId)
          .single(),
      );
      if (existing.status === "sent" || existing.status === "paused")
        return NextResponse.json({ duplicate: true });
      throw new HttpError(
        409,
        "Evento pendiente de revisión; no se reenvía automáticamente.",
      );
    }
    // Persist before external side effects. Unknown outcomes require reconciliation.
    try {
      let paused = false;
      await processChatMessage(
        {
          sessionId: data.key.remoteJid,
          channel: "whatsapp",
          userMessage: text,
        },
        async (result) => {
          if (result.delivery === "paused") {
            paused = true;
            checked(
              await db
                .from("webhook_events")
                .update({ status: "paused" })
                .eq("id", eventId),
            );
            return;
          }
          checked(
            await db
              .from("webhook_events")
              .update({ status: "sending", reply: result.message })
              .eq("id", eventId),
          );
          const sent = await fetch(
            `${base.replace(/\/$/, "")}/message/sendText/${encodeURIComponent(instance)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: key },
              body: JSON.stringify({
                number: data.key.remoteJid,
                text: result.message,
              }),
              signal: AbortSignal.timeout(10000),
            },
          );
          if (!sent.ok) throw new Error("Delivery failed");
          checked(
            await db
              .from("webhook_events")
              .update({ status: "sent" })
              .eq("id", eventId),
          );
        },
      );
      return NextResponse.json(paused ? { paused: true } : { success: true });
    } catch (error) {
      await db
        .from("webhook_events")
        .update({ status: "review" })
        .eq("id", eventId);
      throw error;
    }
  } catch (error) {
    return failure(error);
  }
}
