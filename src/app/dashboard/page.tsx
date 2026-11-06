"use client";
import { useState } from "react";

type Conversation = {
  id: string;
  channel: string;
  handoff: boolean;
  updated_at: string;
};
type Lead = { id: string; conversation_id: string; status: string };
type Product = {
  sku: string;
  name: string;
  price: number;
  currency: string;
  stock: number;
};
type Message = { id: string; role: string; content: string };
type Data = {
  conversations: Conversation[];
  leads: Lead[];
  products: Product[];
  events: { id: string; status: string }[];
  messages: Message[];
};
export default function Dashboard() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  async function load(id = selected) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/admin?conversation=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setData(body);
      setSelected(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }
  async function mutate(action: object) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    } finally {
      setBusy(false);
    }
  }
  const input = "border rounded p-2 bg-background w-full";
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <a className="underline" href="/">
        Volver al chat
      </a>
      <h1 className="text-3xl font-semibold">SalesFlow · Equipo comercial</h1>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label>
          Clave del equipo
          <input
            className={input}
            type="password"
            autoComplete="current-password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <button type="submit" className="border rounded p-3" disabled={busy}>
          Abrir / actualizar panel
        </button>
        <button
          type="button"
          className="underline p-3"
          onClick={() => {
            setToken("");
            setData(null);
            setSelected("");
          }}
        >
          Cerrar sesión
        </button>
      </form>
      {error && (
        <p role="alert" className="text-red-400">
          {error}
        </p>
      )}
      {busy && <output>Procesando…</output>}
      {data && (
        <>
          <div className="grid md:grid-cols-3 gap-6">
            <section className="border rounded-xl p-4 space-y-3">
              <h2 className="text-xl">
                Conversaciones ({data.conversations.length})
              </h2>
              {!data.conversations.length && <p>Sin conversaciones.</p>}
              {data.conversations.map((c) => (
                <article key={c.id} className="border-t pt-3 space-y-2">
                  <button
                    type="button"
                    className="underline text-left break-all"
                    disabled={busy}
                    onClick={() => void load(c.id)}
                  >
                    {c.channel} · {c.id.slice(0, 8)}
                  </button>
                  <p>{c.handoff ? "Atención humana" : "Automatizada"}</p>
                  <button
                    type="button"
                    className="border rounded p-2"
                    disabled={busy}
                    onClick={() =>
                      void mutate({
                        action: "handoff",
                        id: c.id,
                        enabled: !c.handoff,
                      })
                    }
                  >
                    {c.handoff ? "Reanudar bot" : "Tomar conversación"}
                  </button>
                </article>
              ))}
            </section>
            <section className="border rounded-xl p-4 space-y-3">
              <h2 className="text-xl">Oportunidades ({data.leads.length})</h2>
              {!data.leads.length && <p>Sin oportunidades.</p>}
              {data.leads.map((l) => (
                <label className="block" key={l.id}>
                  Conversación {l.conversation_id.slice(0, 8)}
                  <select
                    className={input}
                    disabled={busy}
                    value={l.status}
                    onChange={(e) =>
                      void mutate({
                        action: "lead",
                        id: l.id,
                        status: e.target.value,
                      })
                    }
                  >
                    {["new", "contacted", "won", "lost"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              ))}
            </section>
            <section className="border rounded-xl p-4 space-y-3">
              <h2 className="text-xl">Catálogo ({data.products.length})</h2>
              {data.products.map((p) => (
                <p key={p.sku}>
                  {p.name} · {p.currency} {p.price} · stock {p.stock}
                </p>
              ))}
              <ProductForm busy={busy} save={mutate} />
            </section>
          </div>
          {selected && (
            <section className="border rounded-xl p-4 space-y-3">
              <h2 className="text-xl">Historial</h2>
              {data.messages.map((m) => (
                <p className="whitespace-pre-wrap break-words" key={m.id}>
                  <strong>{m.role}: </strong>
                  {m.content}
                </p>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = e.currentTarget;
                  const text = String(new FormData(f).get("text"));
                  void mutate({ action: "reply", id: selected, text });
                  f.reset();
                }}
              >
                <label>
                  Respuesta del asesor (web)
                  <textarea
                    name="text"
                    required
                    maxLength={4000}
                    className={input}
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="border rounded p-3"
                >
                  Enviar respuesta
                </button>
              </form>
              <p>
                Para WhatsApp, responde desde la instancia de Evolution mientras
                el bot está pausado.
              </p>
            </section>
          )}
          <section>
            <h2 className="text-xl">Entregas que requieren revisión</h2>
            {data.events.length ? (
              data.events.map((e) => (
                <p key={e.id} className="break-all">
                  {e.id} · {e.status}
                </p>
              ))
            ) : (
              <p>Sin entregas pendientes.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
function ProductForm({
  busy,
  save,
}: {
  busy: boolean;
  save: (action: object) => Promise<void>;
}) {
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        void save({
          action: "product",
          sku: f.get("sku"),
          name: f.get("name"),
          description: f.get("description"),
          price: Number(f.get("price")),
          currency: f.get("currency"),
          stock: Number(f.get("stock")),
          active: true,
        });
      }}
    >
      <h3>Crear o actualizar por SKU</h3>
      {["sku", "name", "description", "currency", "price", "stock"].map((n) => (
        <label className="block" key={n}>
          {n}
          <input
            className="border rounded p-2 bg-background w-full"
            name={n}
            required
            type={["price", "stock"].includes(n) ? "number" : "text"}
            min="0"
            step={n === "price" ? "0.01" : "1"}
            defaultValue={n === "currency" ? "ARS" : undefined}
          />
        </label>
      ))}
      <button type="submit" className="border rounded p-3" disabled={busy}>
        Guardar producto
      </button>
    </form>
  );
}
