import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, expect, it } from "vitest";

const db = new PGlite();
beforeAll(async () => {
  await db.exec(
    "CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;",
  );
  const schema = readFileSync("supabase_schema.sql", "utf8");
  await db.exec(schema);
  await db.exec(schema);
}, 30000);
afterAll(async () => {
  await db.close();
});
it("denies both browser roles on every business table and private function", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`SET ROLE ${role}`);
    for (const table of [
      "conversations",
      "messages",
      "products",
      "leads",
      "webhook_events",
      "rate_limits",
    ]) {
      await expect(db.query(`SELECT * FROM public.${table}`)).rejects.toThrow(
        /permission denied/,
      );
    }
    await expect(
      db.query("SELECT public.consume_rate_limit('attack',20)"),
    ).rejects.toThrow(/permission denied/);
    await db.exec("RESET ROLE");
  }
});
it("allows backend storage, enforces uniqueness, bounds quota and serializes turns", async () => {
  await db.exec("SET ROLE service_role");
  const result = await db.query<{ id: string }>(
    "INSERT INTO public.conversations(session_id,channel) VALUES('web:test','web') RETURNING id",
  );
  const id = result.rows[0].id;
  await db.query(
    "INSERT INTO public.messages(conversation_id,role,content) VALUES($1,'user','precio')",
    [id],
  );
  await db.query(
    "INSERT INTO public.webhook_events(id,sender,status) VALUES('test:1','test','processing')",
  );
  await expect(
    db.query(
      "INSERT INTO public.webhook_events(id,sender,status) VALUES('test:1','test','processing')",
    ),
  ).rejects.toThrow(/duplicate/);
  for (const allowed of [true, true, false])
    expect(
      (
        await db.query<{ allowed: boolean }>(
          "SELECT public.consume_rate_limit('test',2) AS allowed",
        )
      ).rows[0].allowed,
    ).toBe(allowed);
  const token = "00000000-0000-4000-8000-000000000001";
  expect(
    (
      await db.query<{ claimed: boolean }>(
        "SELECT public.claim_conversation($1,$2) AS claimed",
        [id, token],
      )
    ).rows[0].claimed,
  ).toBe(true);
  expect(
    (
      await db.query<{ claimed: boolean }>(
        "SELECT public.claim_conversation($1,$2) AS claimed",
        [id, token],
      )
    ).rows[0].claimed,
  ).toBe(false);
  await db.exec("RESET ROLE");
});
