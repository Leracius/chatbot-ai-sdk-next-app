import { z } from "zod";
import { isValidModelId } from "./models";
export const chatSchema = z
  .object({
    messages: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().trim().min(1).max(4000),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    model: z.string().refine(isValidModelId).optional(),
  })
  .strict()
  .refine(
    (v) =>
      v.messages.at(-1)?.role === "user" &&
      v.messages.reduce((n, m) => n + m.content.length, 0) <= 16000,
  );
export const whatsappSchema = z.object({
  event: z.literal("messages.upsert"),
  instance: z.string().optional(),
  data: z.object({
    key: z.object({
      id: z.string().min(1).max(200),
      remoteJid: z.string().regex(/^\d{7,16}@s\.whatsapp\.net$/),
      fromMe: z.boolean(),
    }),
    message: z
      .object({
        conversation: z.string().max(4000).optional(),
        extendedTextMessage: z
          .object({ text: z.string().max(4000) })
          .optional(),
      })
      .optional(),
  }),
});
