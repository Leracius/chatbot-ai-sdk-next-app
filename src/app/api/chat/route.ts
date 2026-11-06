import { type NextRequest, NextResponse } from "next/server";
import { processChatMessage } from "@/lib/chat-service";
import { getConversationHistory, getOrCreateConversation } from "@/lib/memory";
import {
  failure,
  HttpError,
  jsonBody,
  rateLimit,
  sameOrigin,
  session,
} from "@/lib/security";
import { chatSchema } from "@/lib/validation";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const identity = session(request);
    await rateLimit("web:global", 200);
    await rateLimit(`web:${identity.id}`);
    const parsed = chatSchema.safeParse(await jsonBody(request));
    if (!parsed.success)
      throw new HttpError(400, "Mensajes o modelo invÃ¡lidos.");
    const latest = parsed.data.messages.at(-1);
    if (!latest) throw new HttpError(400, "Mensaje vacío.");
    const result = await processChatMessage({
      sessionId: identity.id,
      channel: "web",
      userMessage: latest.content,
      model: parsed.data.model,
    });
    const response = NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set("sales_session", identity.cookie, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 604800,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
export async function GET(request: NextRequest) {
  try {
    await rateLimit("history:global", 600);
    const identity = session(request);
    const conversation = await getOrCreateConversation(identity.id, "web");
    const response = NextResponse.json(
      { messages: await getConversationHistory(conversation.id) },
      { headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set("sales_session", identity.cookie, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 604800,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    sameOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete("sales_session");
    return response;
  } catch (error) {
    return failure(error);
  }
}
