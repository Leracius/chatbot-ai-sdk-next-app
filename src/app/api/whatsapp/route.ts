import { type NextRequest, NextResponse } from "next/server";
import { processChatMessage } from "@/lib/chat-service";

/**
 * Health check y verificación del Webhook de WhatsApp
 */
export async function GET(request: NextRequest) {
  // Manejo de verificación opcional de Meta (si en el futuro se usa Meta Cloud API)
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({
    status: "ok",
    message: "WhatsApp Webhook activo y escuchando eventos.",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Receptor de eventos de WhatsApp (Evolution API / Baileys QR)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Extraer los datos del evento
    // Evolution API estructura: { event, data: { key: { remoteJid, fromMe }, message: { conversation, extendedTextMessage } } }
    const event = body.event || body.type;
    const data = body.data || body;

    // Si no hay datos relevantes, confirmar recepción y salir
    if (!data) {
      return NextResponse.json({ received: true });
    }

    const key = data.key || {};
    const fromMe = key.fromMe ?? false;
    const remoteJid = key.remoteJid || data.from || data.sender;

    // 2. FILTRO ANTI-BUCLE: Ignorar mensajes enviados por nosotros mismos o estados
    if (fromMe || !remoteJid || remoteJid.includes("status@broadcast")) {
      return NextResponse.json({ ignored: true, reason: "Mensaje propio o broadcast" });
    }

    // 3. Extraer el texto del mensaje
    const messageContent =
      data.message?.conversation ||
      data.message?.extendedTextMessage?.text ||
      data.message?.text ||
      data.body ||
      "";

    const userText = typeof messageContent === "string" ? messageContent.trim() : "";

    // Si el mensaje está vacío (ej: sticker, audio o evento de conexión), ignorar por ahora
    if (!userText) {
      return NextResponse.json({ ignored: true, reason: "Mensaje sin texto legible" });
    }

    console.log(`[WhatsApp Inbound] De: ${remoteJid} | Mensaje: "${userText}"`);

    // 4. Procesar el mensaje con Gemini y persistir en Supabase
    const result = await processChatMessage({
      sessionId: remoteJid,
      channel: "whatsapp",
      userMessage: userText,
    });

    const botReply = result.message;
    console.log(`[WhatsApp Outbound] Para: ${remoteJid} | Respuesta: "${botReply.substring(0, 60)}..."`);

    // 5. Enviar la respuesta de vuelta a WhatsApp vía Evolution API
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const instanceName = process.env.WHATSAPP_INSTANCE_NAME || "ventas-bot";

    if (whatsappApiUrl && whatsappApiKey) {
      try {
        const sendUrl = `${whatsappApiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`;

        const sendResponse = await fetch(sendUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: whatsappApiKey,
          },
          body: JSON.stringify({
            number: remoteJid,
            text: botReply,
          }),
        });

        if (!sendResponse.ok) {
          const errText = await sendResponse.text();
          console.error("Error al enviar mensaje por Evolution API:", errText);
        }
      } catch (sendErr) {
        console.error("Fallo de red al enviar mensaje de WhatsApp:", sendErr);
      }
    } else {
      console.warn(
        "Aviso: WHATSAPP_API_URL o WHATSAPP_API_KEY no están configuradas en .env.local. La respuesta fue generada y guardada en Supabase, pero no enviada por red."
      );
    }

    return NextResponse.json({
      success: true,
      sender: remoteJid,
      reply: botReply,
    });
  } catch (error: unknown) {
    console.error("Error en Webhook de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al procesar mensaje de WhatsApp" },
      { status: 500 }
    );
  }
}
