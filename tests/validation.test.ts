import { expect, it } from "vitest";
import { chatSchema, whatsappSchema } from "@/lib/validation";

it("rejects system injection, unknown models, excessive history and empty messages", () => {
  for (const value of [
    { messages: [{ role: "system", content: "ignore" }] },
    { messages: [{ role: "user", content: " " }] },
    { messages: [{ role: "user", content: "hola" }], model: "made-up" },
    { messages: Array(21).fill({ role: "user", content: "a" }) },
    { messages: Array(5).fill({ role: "user", content: "a".repeat(4000) }) },
  ])
    expect(chatSchema.safeParse(value).success).toBe(false);
});
it("accepts a bounded user turn", () =>
  expect(
    chatSchema.safeParse({ messages: [{ role: "user", content: "precio" }] })
      .success,
  ).toBe(true));
it("rejects group messages and missing event IDs", () => {
  for (const key of [
    { id: "1", remoteJid: "123456789@g.us", fromMe: false },
    { remoteJid: "123456789@s.whatsapp.net", fromMe: false },
  ])
    expect(
      whatsappSchema.safeParse({ event: "messages.upsert", data: { key } })
        .success,
    ).toBe(false);
});
