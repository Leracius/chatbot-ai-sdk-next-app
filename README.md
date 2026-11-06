# SalesFlow AI

Asistente comercial con chat web, integración Evolution/WhatsApp, catálogo en PostgreSQL, oportunidades y atención humana. Proyecto de aprendizaje Full Stack y QA Automation. Las respuestas se generan completas, sin streaming.

## Qué implementa

- Catálogo editable desde `/dashboard`; precio, moneda, stock y descripción se incorporan al contexto del modelo.
- Historial web asociado a una cookie firmada HttpOnly; nunca se confía en el historial enviado por el navegador.
- Detección explícita y determinista de intención comercial y solicitud de asesor. Una oportunidad por conversación.
- Panel protegido: conversaciones, historial, estados comerciales, pausa/reanudación, respuesta humana web y eventos de entrega pendientes.
- Evolution: autenticación Bearer, validación de instancia y mensaje, deduplicación persistente y revisión de envíos inciertos.
- Validación Zod, presupuesto de contexto/salida, timeout, cuotas compartidas en PostgreSQL y errores públicos sin detalles internos.
- Vitest, API handlers, PostgreSQL embebido y Playwright; CI no necesita credenciales reales.

## Instalación

Requisitos: Node.js 22, pnpm 10.15.1 y un proyecto Supabase de desarrollo. No hace falta Docker para las pruebas SQL.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
```

1. Configura las variables de `.env.example`. Genera secretos independientes de al menos 32 caracteres para sesión, panel, webhook y mantenimiento. No uses prefijos `NEXT_PUBLIC_` para secretos.
2. Haz una copia de seguridad de tu base. Revisa y ejecuta **todo** `supabase_schema.sql` en el SQL Editor de tu Supabase de desarrollo. Es una transacción repetible para instalación o actualización; elimina las dos políticas públicas originales y revoca permisos a los roles del navegador. Conserva conversaciones y añade el prefijo de canal a sus sesiones. Si existen sesiones antiguas y nuevas duplicadas, resuelve esa colisión antes de aplicar; la transacción falla sin aplicar cambios parciales.
3. Usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` solo en el servidor. No se recurre a una anon key si falta la credencial de servicio.
4. Configura `GOOGLE_GENERATIVE_AI_API_KEY`. Ejecuta `pnpm check:models` con esa variable exportada en tu terminal: el script no carga `.env.local` automáticamente. Comprueba disponibilidad en tu cuenta antes de desplegar.
5. Inicia `pnpm dev`, abre `/dashboard`, introduce `ADMIN_TOKEN` y carga tus productos. No se insertan productos ficticios en tu negocio.
6. Conecta la instancia desde tu administrador de Evolution. Configura webhook por instancia hacia `https://tu-dominio/api/whatsapp`, eventos `MESSAGES_UPSERT`, `webhookByEvents: false`, `base64: false` y header `Authorization: Bearer <WHATSAPP_WEBHOOK_TOKEN>`. El cuerpo debe incluir `instance` igual a `WHATSAPP_INSTANCE_NAME`. Usa una versión de Evolution que admita headers personalizados; si no los admite, actualiza o usa un proxy autenticado. No pongas tokens en la URL ni en HTML público. Consulta la API de tu versión para la ruta de configuración.
7. Configura `WHATSAPP_API_URL`, `WHATSAPP_API_KEY` y `WHATSAPP_INSTANCE_NAME` para el envío. El adaptador acepta mensajes de texto individuales con JID numérico; grupos, audios y otros formatos no se procesan. `GET /api/whatsapp` es salud, no verificación de Meta Cloud API.
8. Programa diariamente un POST autenticado a `/api/maintenance` con `Authorization: Bearer <MAINTENANCE_TOKEN>`. Elimina mensajes de más de 7 días, conversaciones inactivas de más de 7 días y eventos de más de 30 días; sin esta tarea, no se garantiza retención de 7 días. Define también retención de copias de seguridad con tu proveedor.

La credencial de `public/qr.html` fue retirada del archivo actual. **Esto no revoca ni rota la clave y no la borra del historial Git.** Debes revocarla en su emisor, emitir otra y revisar usos anteriores. No se reescribió el historial compartido.

## Uso del equipo

En `/dashboard`, «Tomar conversación» pausa las respuestas automáticas. Si hay un turno en curso, espera y actualiza antes de cambiar el estado. En web puedes enviar una respuesta desde el historial; el cliente la ve al recargar. En WhatsApp responde desde Evolution mientras el bot está pausado y confirma la entrega allí. «Reanudar bot» vuelve al modo automático.

El token del panel permanece solo en memoria de la página; «Cerrar sesión» lo descarta. Es un panel interno de un único negocio con una clave compartida, no un CRM multiempresa ni autenticación individual con MFA. Protege el acceso operativo y cambia el token si se comparte indebidamente.

«Nueva conversación» descarta la cookie del navegador y empieza una sesión nueva; no borra registros ya almacenados. Para una solicitud de eliminación, el operador debe localizar la conversación y eliminarla desde Supabase (los mensajes y el lead se eliminan en cascada). No implementa pedidos, cobros, reservas de stock ni un checkout.

## Verificación

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit --prod
```

Playwright inicia el build de producción. Los flujos de interfaz usan respuestas interceptadas para ser deterministas; también se prueban límites HTTP reales sin credenciales. Vitest prueba los handlers y el servicio con proveedores simulados. PGlite ejecuta el SQL real, incluidas denegaciones para `anon`/`authenticated`, permisos de servicio, cuotas, unicidad de eventos y leases. Eso no sustituye verificar PostgREST/RLS en tu proyecto Supabase.

Antes de producción, verifica con cuentas de desarrollo: modelos disponibles y generación, inserciones/lecturas a través de Supabase, dos sesiones web aisladas, webhook legítimo y falso, repetición del mismo ID, fallo de envío, intervención humana y limpieza programada. CI produce reportes y trazas de Playwright sin usar secretos productivos.

## Límites de fiabilidad y privacidad

- El webhook se procesa de forma síncrona; configura el timeout de hosting para el turno (hasta 25 s de IA + 10 s de envío + base). No hay una cola durable con worker separado.
- La restricción única evita procesar otra vez un ID recibido. Ante un estado `processing`, `sending` o `review`, el duplicado devuelve 409. El operador debe revisar el mensaje en Evolution y el registro antes de actuar. No existe garantía exactamente una vez entre PostgreSQL y Evolution. No se reintenta ciegamente un envío de resultado desconocido.
- Si falla el proceso después de guardar el evento, se conserva para revisión, incluso si quedó en `processing`. Los leases de conversación vencen a los 90 s. Los clientes web no reintentan automáticamente los POST: una repetición manual puede crear otro turno.
- La cuota web global limita 200 solicitudes/minuto y la de sesión 20/minuto; sigue siendo una demo pública susceptible de consumo distribuido dentro de esa cuota. Ajusta límites y presupuesto en Google, y agrega protección perimetral según tu tráfico.
- El catálogo fundamenta el prompt, pero un modelo todavía puede equivocarse o seguir una inyección. No uses sus respuestas para cobros o decisiones irreversibles. Las reglas de leads son heurísticas por palabras clave y pueden tener falsos positivos.
- Los mensajes se almacenan en Supabase y el historial reciente se envía a Google para generar respuestas. Los eventos guardan identificadores del canal y la respuesta necesaria para conciliación. Los logs de aplicación solo registran un identificador de error, sin teléfonos, texto ni errores del proveedor.

## Aprendizaje y arquitectura

Lee [arquitectura y decisiones](docs/architecture.md), [etapas](docs/stages.md) y [validación](docs/verification.md). La interfaz conserva componentes AI Elements/Radix y Streamdown; el valor del proyecto está en integrar y verificar el flujo, no en atribuirse esas bibliotecas.

Modelos revisados el 5 de noviembre de 2026 contra la [documentación de Google](https://firebase.google.com/docs/ai-logic/models?api=dev): `gemini-3.8-flash` y `gemini-3.5-flash-lite`. La disponibilidad y cuota por cuenta requieren el preflight. AI SDK permanece en la versión mayor 5 para mantener el contrato existente; migrar a una versión mayor reciente requiere otra revisión de APIs y pruebas.
