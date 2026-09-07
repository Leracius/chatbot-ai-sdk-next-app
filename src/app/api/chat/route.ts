import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { type NextRequest, NextResponse } from "next/server";

import { UI_TEXT } from "@/lib/consts";
import { DEFAULT_MODEL_ID, isValidModelId } from "@/lib/models";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/prompts";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Validar la configuración de la clave de API
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        {
          error: UI_TEXT.ERROR_MISSING_API_KEY,
          code: "MISSING_API_KEY",
        },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No se recibieron mensajes para procesar." },
        { status: 400 }
      );
    }

    // 2. Determinar el modelo seleccionado (con fallback al modelo por defecto)
    const activeModelId =
      model && isValidModelId(model) ? model : DEFAULT_MODEL_ID;

    // 3. Formatear mensajes para el SDK de AI
    const formattedMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
    }));

    // 4. Invocar el modelo con Google Gemini
    const { text } = await generateText({
      model: google(activeModelId),
      system: DEFAULT_SYSTEM_PROMPT,
      messages: formattedMessages,
    });

    const response: ChatResponse = {
      message: text,
      model: activeModelId,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error al procesar la solicitud de chat:", error);

    const errorMessage =
      error instanceof Error ? error.message : UI_TEXT.ERROR_GENERIC;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
