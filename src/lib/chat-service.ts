import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { UI_TEXT } from "./consts";
import {
  getConversationHistory,
  getOrCreateConversation,
  saveMessage,
} from "./memory";
import { DEFAULT_MODEL_ID, isValidModelId } from "./models";
import { DEFAULT_SYSTEM_PROMPT } from "./prompts";
import { isSupabaseConfigured } from "./supabase";
import type { MessageRole } from "./types";

export interface ChatServiceInput {
  sessionId?: string;
  channel?: "web" | "whatsapp";
  userMessage?: string;
  messages?: Array<{ role: MessageRole; content: string }>;
  model?: string;
}

export interface ChatServiceOutput {
  message: string;
  model: string;
  conversationId?: string;
}

/**
 * Servicio centralizado de IA: Conecta Google Gemini con Supabase
 * para responder tanto a la Web como a WhatsApp de forma unificada.
 */
export async function processChatMessage(
  input: ChatServiceInput
): Promise<ChatServiceOutput> {
  const {
    sessionId,
    channel = "web",
    userMessage,
    messages: inputMessages,
    model,
  } = input;

  // 1. Validar la clave de Google Gemini
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(UI_TEXT.ERROR_MISSING_API_KEY);
  }

  // 2. Determinar el modelo activo
  const activeModelId =
    model && isValidModelId(model) ? model : DEFAULT_MODEL_ID;

  let conversationId: string | undefined;
  let formattedMessages: Array<{ role: MessageRole; content: string }> = [];

  // 3. Si hay sessionId y Supabase está configurado (ej: WhatsApp o Web persistida)
  if (sessionId && isSupabaseConfigured && userMessage) {
    const conversation = await getOrCreateConversation(sessionId, channel);

    if (conversation) {
      conversationId = conversation.id;

      // Recuperar los últimos mensajes de la base de datos
      const history = await getConversationHistory(conversationId, 10);

      // Guardar el nuevo mensaje del usuario en la base de datos
      await saveMessage(conversationId, "user", userMessage);

      // Ensamblar historial + nuevo mensaje
      formattedMessages = [
        ...history,
        { role: "user", content: userMessage },
      ];
    }
  }

  // Si no se usó Supabase (o es modo memoria directa desde la web)
  if (formattedMessages.length === 0) {
    if (inputMessages && inputMessages.length > 0) {
      formattedMessages = inputMessages;
    } else if (userMessage) {
      formattedMessages = [{ role: "user", content: userMessage }];
    } else {
      throw new Error("No se recibieron mensajes para procesar.");
    }
  }

  // 4. Invocar el modelo con Google Gemini
  const { text } = await generateText({
    model: google(activeModelId),
    system: DEFAULT_SYSTEM_PROMPT,
    messages: formattedMessages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    })),
  });

  // 5. Guardar la respuesta del asistente en Supabase si aplica
  if (conversationId && isSupabaseConfigured) {
    await saveMessage(conversationId, "assistant", text);
  }

  return {
    message: text,
    model: activeModelId,
    conversationId,
  };
}
