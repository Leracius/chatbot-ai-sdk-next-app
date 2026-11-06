import { beforeEach, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  generate: vi.fn(),
  save: vi.fn(),
  conversation: vi.fn(),
  history: vi.fn(),
  rpc: vi.fn(),
  query: vi.fn(),
  update: vi.fn(),
}));
vi.mock("ai", () => ({ generateText: m.generate }));
vi.mock("@ai-sdk/google", () => ({ google: (id: string) => id }));
vi.mock("@/lib/memory", () => ({
  getOrCreateConversation: m.conversation,
  getConversationHistory: m.history,
  saveMessage: m.save,
}));
vi.mock("@/lib/supabase", () => ({
  database: () => ({
    rpc: m.rpc,
    from: () => ({
      select: () => ({ eq: () => ({ limit: m.query }) }),
      update: (value: unknown) => {
        m.update(value);
        const chain = Promise.resolve({ data: null }) as Promise<{
          data: null;
        }> & { eq: () => unknown };
        chain.eq = () => chain;
        return chain;
      },
      upsert: m.query,
    }),
  }),
  checked: ({ data, error }: { data: unknown; error: unknown }) => {
    if (error) throw Error();
    return data;
  },
}));

import { processChatMessage } from "@/lib/chat-service";

beforeEach(() => {
  m.conversation.mockResolvedValue({ id: "conversation", handoff: false });
  m.history.mockResolvedValue([]);
  m.save.mockResolvedValue(undefined);
  m.rpc.mockResolvedValue({ data: true });
  m.query.mockResolvedValue({
    data: [
      { sku: "item", name: "Producto", price: 500, stock: 2, currency: "ARS" },
    ],
  });
  m.generate.mockResolvedValue({ text: "Producto ARS 500" });
});
it("grounds generation in catalog, records a lead, persists the exchange and releases the lease", async () => {
  const result = await processChatMessage({
    sessionId: "test",
    channel: "web",
    userMessage: "quiero comprar",
  });
  expect(result.message).toBe("Producto ARS 500");
  expect(m.generate.mock.calls[0][0].system).toContain('"price":500');
  expect(m.save).toHaveBeenCalledWith(
    "conversation",
    "assistant",
    "Producto ARS 500",
  );
  expect(m.query).toHaveBeenCalledWith(
    { conversation_id: "conversation", status: "new" },
    { onConflict: "conversation_id", ignoreDuplicates: true },
  );
  expect(m.update).toHaveBeenLastCalledWith({
    lock_token: null,
    locked_until: null,
  });
});
it("human-mode stores the inbound message without invoking Gemini", async () => {
  m.conversation.mockResolvedValue({ id: "conversation", handoff: true });
  expect(
    (
      await processChatMessage({
        sessionId: "test",
        channel: "web",
        userMessage: "hola",
      })
    ).model,
  ).toBe("human");
  expect(m.save).toHaveBeenCalledWith("conversation", "user", "hola");
  expect(m.generate).not.toHaveBeenCalled();
});
it("an explicit request pauses automation before any model call", async () => {
  await processChatMessage({
    sessionId: "test",
    channel: "web",
    userMessage: "quiero un asesor",
  });
  expect(m.update).toHaveBeenCalledWith({ handoff: true });
  expect(m.generate).not.toHaveBeenCalled();
});
it("a persistence failure prevents a success response and releases the lease", async () => {
  m.save.mockRejectedValue(Error("db failure"));
  await expect(
    processChatMessage({
      sessionId: "test",
      channel: "web",
      userMessage: "hola",
    }),
  ).rejects.toThrow();
  expect(m.generate).not.toHaveBeenCalled();
  expect(m.update).toHaveBeenLastCalledWith({
    lock_token: null,
    locked_until: null,
  });
});
it("concurrent turns are rejected before persisting or invoking the provider", async () => {
  m.rpc.mockResolvedValue({ data: false });
  await expect(
    processChatMessage({
      sessionId: "test",
      channel: "web",
      userMessage: "hola",
    }),
  ).rejects.toMatchObject({ status: 409 });
  expect(m.save).not.toHaveBeenCalled();
  expect(m.generate).not.toHaveBeenCalled();
});

it("keeps the lease until external delivery finishes and releases it on delivery failure", async () => {
  const deliver = vi.fn(async () => {
    expect(m.update).not.toHaveBeenCalledWith({
      lock_token: null,
      locked_until: null,
    });
    throw new Error("uncertain delivery");
  });
  await expect(
    processChatMessage(
      { sessionId: "test", channel: "whatsapp", userMessage: "hola" },
      deliver,
    ),
  ).rejects.toThrow("uncertain delivery");
  expect(deliver).toHaveBeenCalledOnce();
  expect(m.update).toHaveBeenLastCalledWith({
    lock_token: null,
    locked_until: null,
  });
});
