import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  process: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  existing: vi.fn(),
  fetch: vi.fn(),
}));
vi.mock("@/lib/chat-service", () => ({ processChatMessage: m.process }));
vi.mock("@/lib/supabase", () => ({
  database: () => ({
    rpc: m.rpc,
    from: () => ({
      insert: m.insert,
      update: (value: unknown) => {
        m.update(value);
        return { eq: () => Promise.resolve({ data: null }) };
      },
      select: () => ({ eq: () => ({ single: m.existing }) }),
    }),
  }),
  checked: ({ data, error }: { data: unknown; error: unknown }) => {
    if (error) throw Error();
    return data;
  },
}));

import { POST } from "@/app/api/whatsapp/route";

const body = {
  event: "messages.upsert",
  instance: "test",
  data: {
    key: {
      id: "event-1",
      remoteJid: "5491112345678@s.whatsapp.net",
      fromMe: false,
    },
    message: { conversation: "precio" },
  },
};
const req = (token = "test-token", value: unknown = body) =>
  new NextRequest("http://localhost/api/whatsapp", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  process.env.WHATSAPP_WEBHOOK_TOKEN = "test-token";
  process.env.WHATSAPP_INSTANCE_NAME = "test";
  process.env.WHATSAPP_API_URL = "https://evolution.example";
  process.env.WHATSAPP_API_KEY = "private";
  m.rpc.mockResolvedValue({ data: true });
  m.insert.mockResolvedValue({ error: null });
  m.process.mockImplementation(async (_input, deliver) => {
    const result = {
      message: "Respuesta",
      model: "gemini-3.8-flash",
      delivery: "reply",
    };
    await deliver(result);
    return result;
  });
  m.fetch.mockResolvedValue(new Response("{}"));
  vi.stubGlobal("fetch", m.fetch);
});
it("rejects spoofed webhook before parsing or paid operations", async () => {
  expect((await POST(req("wrong"))).status).toBe(401);
  expect(m.insert).not.toHaveBeenCalled();
  expect(m.process).not.toHaveBeenCalled();
});
it("accepts one delivery and marks sent only after provider acknowledgement", async () => {
  expect((await POST(req())).status).toBe(200);
  expect(m.fetch).toHaveBeenCalledOnce();
  expect(m.update).toHaveBeenLastCalledWith({ status: "sent" });
});
it("does not generate or deliver twice on duplicate event", async () => {
  m.insert.mockResolvedValue({ error: { code: "23505" } });
  m.existing.mockResolvedValue({ data: { status: "sent" } });
  expect((await POST(req())).status).toBe(200);
  expect(m.process).not.toHaveBeenCalled();
  expect(m.fetch).not.toHaveBeenCalled();
});
it("does not retry unknown outcomes automatically", async () => {
  m.insert.mockResolvedValue({ error: { code: "23505" } });
  m.existing.mockResolvedValue({ data: { status: "sending" } });
  expect((await POST(req())).status).toBe(409);
  expect(m.fetch).not.toHaveBeenCalled();
});
it("surfaces send failure and retains a review record", async () => {
  m.fetch.mockResolvedValue(new Response("upstream secret", { status: 502 }));
  const r = await POST(req());
  expect(r.status).toBe(503);
  expect(m.update).toHaveBeenLastCalledWith({ status: "review" });
  expect(JSON.stringify(await r.json())).not.toContain("secret");
});
it("stores incoming human-mode messages without automatic outbound replies", async () => {
  m.process.mockImplementation(async (_input, deliver) => {
    const result = {
      message: "Un asesor atenderá tu conversación.",
      model: "human",
      delivery: "paused",
    };
    await deliver(result);
    return result;
  });
  expect((await POST(req())).status).toBe(200);
  expect(m.fetch).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith({ status: "paused" });
});
