import { checked, database } from "./supabase";
import type { MessageRole } from "./types";
export async function getOrCreateConversation(
  sessionId: string,
  channel: "web" | "whatsapp" = "web",
) {
  const db = database();
  checked(
    await db
      .from("conversations")
      .upsert(
        { session_id: `${channel}:${sessionId}`, channel },
        { onConflict: "session_id", ignoreDuplicates: true },
      ),
  );
  return checked(
    await db
      .from("conversations")
      .select("*")
      .eq("session_id", `${channel}:${sessionId}`)
      .single(),
  );
}
export async function getConversationHistory(
  id: string,
  limit = 20,
): Promise<Array<{ role: MessageRole; content: string }>> {
  return checked(
    await database()
      .from("messages")
      .select("role,content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit),
  ).reverse();
}
export async function saveMessage(
  id: string,
  role: MessageRole,
  content: string,
) {
  checked(
    await database()
      .from("messages")
      .insert({ conversation_id: id, role, content }),
  );
}
