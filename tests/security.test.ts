import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase", () => ({
  database: () => ({ rpc }),
  checked: ({ data, error }: { data: unknown; error: unknown }) => {
    if (error) throw Error();
    return data;
  },
}));

import {
  constantEqual,
  jsonBody,
  rateLimit,
  requireToken,
  sameOrigin,
  session,
} from "@/lib/security";

beforeEach(() => {
  process.env.SESSION_SECRET = "s".repeat(32);
  process.env.ADMIN_TOKEN = "secret";
  rpc.mockResolvedValue({ data: true });
});
it("rejects missing, wrong and unconfigured credentials", () => {
  expect(() =>
    requireToken(new Request("http://localhost"), "ADMIN_TOKEN"),
  ).toThrow();
  expect(() =>
    requireToken(
      new Request("http://localhost", {
        headers: { authorization: "Bearer wrong" },
      }),
      "ADMIN_TOKEN",
    ),
  ).toThrow();
  expect(() =>
    requireToken(
      new Request("http://localhost", {
        headers: { authorization: "Bearer secret" },
      }),
      "ADMIN_TOKEN",
    ),
  ).not.toThrow();
  delete process.env.ADMIN_TOKEN;
  expect(() =>
    requireToken(new Request("http://localhost"), "ADMIN_TOKEN"),
  ).toThrow();
});
it("uses signed expiring server identities", () => {
  const a = session(new NextRequest("http://localhost"));
  expect(
    session(
      new NextRequest("http://localhost", {
        headers: { cookie: `sales_session=${a.cookie}` },
      }),
    ).id,
  ).toBe(a.id);
  expect(
    session(
      new NextRequest("http://localhost", {
        headers: { cookie: `sales_session=${a.cookie}x` },
      }),
    ).id,
  ).not.toBe(a.id);
  expect(constantEqual("abc", "abcd")).toBe(false);
});
it("rejects expired signatures", () => {
  vi.useFakeTimers();
  const a = session(new NextRequest("http://localhost"));
  vi.advanceTimersByTime(8 * 86400000);
  expect(
    session(
      new NextRequest("http://localhost", {
        headers: { cookie: `sales_session=${a.cookie}` },
      }),
    ).id,
  ).not.toBe(a.id);
  vi.useRealTimers();
});
it("limits streamed bodies even without Content-Length", async () => {
  await expect(
    jsonBody(
      new Request("http://localhost", {
        method: "POST",
        body: '{"text":"long"}',
      }),
      5,
    ),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    jsonBody(new Request("http://localhost", { method: "POST", body: "{" })),
  ).rejects.toMatchObject({ status: 400 });
});
it("enforces a shared quota and fails closed on database failure", async () => {
  rpc.mockResolvedValueOnce({ data: false });
  await expect(rateLimit("test")).rejects.toMatchObject({ status: 429 });
  rpc.mockResolvedValueOnce({ error: {} });
  await expect(rateLimit("test")).rejects.toThrow();
});
it("rejects cross-origin browser writes", () =>
  expect(() =>
    sameOrigin(
      new Request("http://localhost", {
        headers: { origin: "https://evil.example" },
      }),
    ),
  ).toThrow());
