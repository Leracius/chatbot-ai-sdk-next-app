import { google } from "@ai-sdk/google";
import { generateText } from "ai";

import { type NextRequest, NextResponse } from "next/server";

import { GAME_PROMPTS } from "@/lib/prompts";
import { GAME_CONFIG } from "@/lib/consts";
import { GenerateStoryRequest } from "@/lib/types";

// Aca se recibe el request del front-end
// Se extraen userMessage, conversationHistory e isStart
// Se construye el prompt segun si es inicio o no
// Se llama a la API de Gemini con el prompt
// Se procesa la respuesta para extraer la historia y la descripcion de la imagen
// Se llama a la API de generacion de imagenes con la descripcion
// Se construye y retorna el response con la historia y la imagen

export async function POST(request: NextRequest) {
  try {
    const { userMessage, conversationHistory, isStart }: GenerateStoryRequest =
      await request.json();

    let prompt: string = GAME_PROMPTS.INITIAL_STORY;

    if (!isStart) {
      const historyText = conversationHistory
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      prompt = GAME_PROMPTS.CONTINUE_STORY(historyText, userMessage);
    }

    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      prompt,
    });

    const [narrative, imagePrompt] = text.split(GAME_CONFIG.IMAGE.SEPARATOR);

    return NextResponse.json({ narrative, imagePrompt });
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: "Error generaring story" },
      { status: 500 }
    );
  }
}
