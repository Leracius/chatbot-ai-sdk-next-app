import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { checked, database } from "./supabase";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function constantEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function requireToken(request: Request, env: string) {
  const expected = process.env[env];
  if (!expected) throw new HttpError(503, "Servicio no configurado.");
  if (
    !constantEqual(
      request.headers.get("authorization") || "",
      `Bearer ${expected}`,
    )
  )
    throw new HttpError(401, "No autorizado.");
}
export async function jsonBody(request: Request, max = 32768) {
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Solicitud vacía.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Solicitud demasiado grande.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "JSON inválido.");
  }
}
export function failure(error: unknown) {
  const id = randomUUID();
  if (!(error instanceof HttpError))
    console.error(JSON.stringify({ event: "request_failed", id }));
  return NextResponse.json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : "No se pudo completar la operación. Intenta más tarde.",
      requestId: id,
    },
    {
      status: error instanceof HttpError ? error.status : 503,
      headers: {
        "Cache-Control": "no-store",
        ...(error instanceof HttpError && error.status === 429
          ? { "Retry-After": "60" }
          : {}),
      },
    },
  );
}
export function session(request: NextRequest) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, "Servicio no configurado.");
  const sign = (s: string) =>
    createHmac("sha256", secret).update(s).digest("hex");
  const cookie = request.cookies.get("sales_session")?.value || "";
  const [id, expires, signature] = cookie.split(".");
  if (
    id &&
    expires &&
    signature &&
    Number(expires) > Date.now() &&
    constantEqual(signature, sign(`${id}.${expires}`))
  )
    return { id, cookie };
  const next = `${randomUUID()}.${Date.now() + 7 * 86400000}`;
  return { id: next.split(".")[0], cookie: `${next}.${sign(next)}` };
}
export async function rateLimit(key: string, limit = 20) {
  // A single database transaction coordinates all server instances.
  const allowed = checked(
    await database().rpc("consume_rate_limit", {
      bucket_key: key,
      maximum: limit,
    }),
  );
  if (!allowed)
    throw new HttpError(429, "Demasiadas solicitudes. Intenta en un minuto.");
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Origen no permitido.");
}
