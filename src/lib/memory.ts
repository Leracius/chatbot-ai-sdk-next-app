import { isSupabaseConfigured, supabase } from "./supabase";
import type { MessageRole } from "./types";

export interface StoredMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

export interface StoredConversation {
  id: string;
  session_id: string;
  channel: "web" | "whatsapp";
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene una conversación existente por session_id o la crea si no existe.
 */
export async function getOrCreateConversation(
  sessionId: string,
  channel: "web" | "whatsapp" = "whatsapp"
): Promise<StoredConversation | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    // 1. Intentar buscar conversación existente
    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (findError) {
      console.error("Error al buscar conversación en Supabase:", findError);
    }

    if (existing) {
      return existing as StoredConversation;
    }

    // 2. Si no existe, crear una nueva
    const { data: created, error: createError } = await supabase
      .from("conversations")
      .insert({
        session_id: sessionId,
        channel,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error al crear conversación en Supabase:", createError);
      return null;
    }

    return created as StoredConversation;
  } catch (err) {
    console.error("Error inesperado en getOrCreateConversation:", err);
    return null;
  }
}

/**
 * Recupera los últimos N mensajes de una conversación ordenados cronológicamente.
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<Array<{ role: MessageRole; content: string }>> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  try {
    // Obtenemos los últimos 'limit' mensajes (descendente por fecha para tomar los más recientes)
    const { data, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error al obtener historial en Supabase:", error);
      return [];
    }

    // Los revertimos para que queden en orden cronológico (ascendente)
    return (data || []).reverse().map((msg) => ({
      role: msg.role as MessageRole,
      content: msg.content,
    }));
  } catch (err) {
    console.error("Error inesperado en getConversationHistory:", err);
    return [];
  }
}

/**
 * Guarda un nuevo mensaje en la conversación dentro de Supabase.
 */
export async function saveMessage(
  conversationId: string,
  role: MessageRole,
  content: string
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });

    if (error) {
      console.error("Error al guardar mensaje en Supabase:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error inesperado en saveMessage:", err);
    return false;
  }
}
