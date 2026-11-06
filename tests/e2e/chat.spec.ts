import { expect, test } from "@playwright/test";

test("chat sends, restores server history, reports errors and clears", async ({
  page,
}) => {
  let messages: { role: string; content: string }[] = [];
  let fail = false;
  await page.route("**/api/chat", async (route) => {
    const method = route.request().method();
    if (method === "DELETE") {
      messages = [];
      await route.fulfill({ json: { ok: true } });
      return;
    }
    if (method === "GET") {
      await route.fulfill({ json: { messages } });
      return;
    }
    if (fail) {
      await route.fulfill({
        status: 503,
        json: { error: "Servicio temporalmente no disponible" },
      });
      return;
    }
    messages = [
      { role: "user", content: "Quiero comprar" },
      { role: "assistant", content: "Consulta registrada" },
    ];
    await route.fulfill({
      json: { message: "Consulta registrada", model: "gemini-3.8-flash" },
    });
  });
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Mensaje", exact: true })
    .fill("Quiero comprar");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(
    page.getByText("Consulta registrada", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Consulta registrada", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Nueva conversación", exact: true })
    .click();
  await expect(
    page.getByText("Consulta registrada", { exact: true }),
  ).toHaveCount(0);
  fail = true;
  await page
    .getByRole("textbox", { name: "Mensaje", exact: true })
    .fill("otra consulta");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(
    page.getByText("Servicio temporalmente no disponible"),
  ).toBeVisible();
});
test("dashboard handles unauthorized access without exposing data", async ({
  page,
}) => {
  await page.route("**/api/admin*", (route) =>
    route.fulfill({ status: 401, json: { error: "No autorizado." } }),
  );
  await page.goto("/dashboard");
  await page.getByLabel("Clave del equipo").fill("incorrecta");
  await page.getByRole("button", { name: "Abrir / actualizar panel" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "No autorizado." }),
  ).toHaveText("No autorizado.");
  await expect(
    page.getByRole("heading", { name: /Oportunidades/ }),
  ).toHaveCount(0);
});
test("real HTTP boundaries reject unauthenticated webhook and admin", async ({
  request,
}) => {
  expect((await request.post("/api/whatsapp", { data: {} })).status()).toBe(
    503,
  );
  expect((await request.get("/api/admin")).status()).toBe(503);
});

test("dashboard manages catalog, lead and human intervention", async ({
  page,
}) => {
  const id = "00000000-0000-4000-8000-000000000001";
  const data = {
    conversations: [
      {
        id,
        channel: "web",
        handoff: false,
        updated_at: new Date().toISOString(),
      },
    ],
    leads: [{ id, conversation_id: id, status: "new" }],
    products: [] as {
      sku: string;
      name: string;
      price: number;
      currency: string;
      stock: number;
    }[],
    events: [],
    messages: [] as { id: string; role: string; content: string }[],
  };
  await page.route("**/api/admin*", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: data });
      return;
    }
    expect(route.request().headers().authorization).toBe("Bearer test-team");
    const action = route.request().postDataJSON();
    if (action.action === "handoff")
      data.conversations[0].handoff = action.enabled;
    if (action.action === "lead") data.leads[0].status = action.status;
    if (action.action === "product") data.products = [action];
    if (action.action === "reply")
      data.messages.push({
        id: "reply",
        role: "assistant",
        content: action.text,
      });
    await route.fulfill({ json: { ok: true } });
  });
  await page.goto("/dashboard");
  await page.getByLabel("Clave del equipo").fill("test-team");
  await page.getByRole("button", { name: "Abrir / actualizar panel" }).click();
  await page.getByRole("button", { name: "Tomar conversación" }).click();
  await expect(
    page.getByText("Atención humana", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Conversación 00000000").selectOption("contacted");
  await expect(page.getByLabel("Conversación 00000000")).toHaveValue(
    "contacted",
  );
  for (const [name, value] of Object.entries({
    sku: "DEMO",
    name: "Teclado",
    description: "Producto de prueba",
    currency: "ARS",
    price: "100",
    stock: "4",
  }))
    await page.getByLabel(name, { exact: true }).fill(value);
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByText("Teclado · ARS 100 · stock 4")).toBeVisible();
  await page.getByRole("button", { name: "web · 00000000" }).click();
  await page
    .getByLabel("Respuesta del asesor (web)")
    .fill("Hola, soy tu asesor");
  await page.getByRole("button", { name: "Enviar respuesta" }).click();
  await expect(
    page.getByText("Hola, soy tu asesor", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reanudar bot" }).click();
  await expect(page.getByText("Automatizada", { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: /Oportunidades/ }),
  ).toHaveCount(0);
});
