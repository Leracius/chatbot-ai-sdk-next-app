import { type NextRequest, NextResponse } from "next/server";

import { processChatMessage } from "@/lib/chat-service";
import { UI_TEXT } from "@/lib/consts";
import type { ChatRequest, ChatResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, model } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No se recibieron mensajes para procesar." },
        { status: 400 }
      );
    }

    const result = await processChatMessage({
      channel: "web",
      messages,
      model,
    });

    const response: ChatResponse = {
      message: result.message,
      model: result.model,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error al procesar la solicitud de chat web:", error);

    const errorMessage =
      error instanceof Error ? error.message : UI_TEXT.ERROR_GENERIC;

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
