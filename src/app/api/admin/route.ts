import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  failure,
  HttpError,
  jsonBody,
  rateLimit,
  requireToken,
  sameOrigin,
} from "@/lib/security";
import { checked, database } from "@/lib/supabase";

const action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("handoff"),
    id: z.string().uuid(),
    enabled: z.boolean(),
  }),
  z.object({
    action: z.literal("lead"),
    id: z.string().uuid(),
    status: z.enum(["new", "contacted", "won", "lost"]),
  }),
  z.object({
    action: z.literal("reply"),
    id: z.string().uuid(),
    text: z.string().trim().min(1).max(4000),
  }),
  z.object({
    action: z.literal("product"),
    sku: z.string().min(1).max(50),
    name: z.string().min(1).max(120),
    description: z.string().max(1000),
    price: z.number().nonnegative().max(1e9),
    currency: z.string().regex(/^[A-Z]{3}$/),
    stock: z.number().int().nonnegative(),
    active: z.boolean(),
  }),
]);
export async function GET(request: NextRequest) {
  try {
    requireToken(request, "ADMIN_TOKEN");
    await rateLimit("admin", 60);
    const db = database();
    const [conversations, leads, products, events] = await Promise.all([
      db
        .from("conversations")
        .select("id,channel,handoff,updated_at")
        .order("updated_at", { ascending: false })
        .limit(50),
      db
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      db.from("products").select("*").order("name").limit(50),
      db
        .from("webhook_events")
        .select("id,status,created_at")
        .in("status", ["review", "processing", "sending"])
        .limit(50),
    ]);
    const id = request.nextUrl.searchParams.get("conversation");
    if (id && !z.string().uuid().safeParse(id).success)
      throw new HttpError(400, "ID invÃ¡lido.");
    const messages = id
      ? checked(
          await db
            .from("messages")
            .select("id,role,content,created_at")
            .eq("conversation_id", id)
            .order("created_at", { ascending: false })
            .limit(50),
        ).reverse()
      : [];
    return NextResponse.json(
      {
        conversations: checked(conversations),
        leads: checked(leads),
        products: checked(products),
        events: checked(events),
        messages,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    requireToken(request, "ADMIN_TOKEN");
    sameOrigin(request);
    await rateLimit("admin", 60);
    const parsed = action.safeParse(await jsonBody(request));
    if (!parsed.success) throw new HttpError(400, "AcciÃ³n invÃ¡lida.");
    const a = parsed.data,
      db = database();
    if (a.action === "handoff")
      checked(
        await db
          .from("conversations")
          .update({ handoff: a.enabled })
          .eq("id", a.id)
          .or(
            `locked_until.is.null,locked_until.lt.${new Date().toISOString()}`,
          )
          .select()
          .single(),
      );
    if (a.action === "lead")
      checked(
        await db
          .from("leads")
          .update({ status: a.status })
          .eq("id", a.id)
          .select()
          .single(),
      );
    if (a.action === "product") {
      const { action: _, ...product } = a;
      checked(await db.from("products").upsert(product));
    }
    if (a.action === "reply") {
      const conversation = checked(
        await db
          .from("conversations")
          .select("channel,handoff")
          .eq("id", a.id)
          .single(),
      );
      if (!conversation.handoff)
        throw new HttpError(409, "Activa la atenciÃ³n humana primero.");
      if (conversation.channel !== "web")
        throw new HttpError(
          409,
          "Responde desde Evolution para WhatsApp y verifica la entrega allÃ­.",
        );
      checked(
        await db.from("messages").insert({
          conversation_id: a.id,
          role: "assistant",
          content: a.text,
        }),
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
