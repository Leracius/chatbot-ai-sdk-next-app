# Registro de verificación — 5 de noviembre de 2026

| Comprobación | Resultado local |
| --- | --- |
| TypeScript | Sin errores |
| Vitest | 27 pruebas: validación, seguridad, API, servicio y WhatsApp |
| SQL real en PGlite | Incluido: esquema repetible, RLS/grants, cuotas, unicidad y leases |
| Build de producción | Next.js 15.5.29, sin claves reales |
| Playwright Chromium | 4 flujos: chat/historial/errores, acceso denegado, gestión comercial y límites HTTP |
| Auditoría de producción | 0 vulnerabilidades conocidas en el momento de ejecutar `pnpm audit --prod` |
| Biome en archivos modificados | Sin diagnósticos; CI verifica el diff contra main |

## Alcance y pendientes

Los flujos comerciales del navegador usan interceptores de API para resultados deterministas. Los handlers y el servicio usan mocks de proveedores; el SQL sí se ejecuta sobre PostgreSQL embebido. No se han aplicado cambios a un proyecto Supabase ni enviado mensajes reales de WhatsApp ni consumido Gemini. La disponibilidad de modelos en la cuenta debe comprobarse con `pnpm check:models`.

El primer intento de build con Turbopack falló en este entorno al arrancar un proceso de transformación CSS. El script de producción usa `next build` con el compilador predeterminado y compila correctamente. El desarrollo conserva Turbopack.

`pnpm lint` sobre todo el árbol todavía reporta problemas de formato/estilo en componentes heredados que no forman parte del cambio. Los archivos modificados pasan Biome; CI comprueba ese conjunto para no mezclar una reformatación global con esta implementación. No se presenta el lint global como aprobado.

No hay garantía de entrega exactamente una vez, reintentos de worker ni usuarios administrativos individuales. Los envíos inciertos requieren conciliación. La limpieza de datos requiere programar `/api/maintenance`. La clave antes expuesta fue retirada del archivo público, pero no se rotó ni se revocó y sigue siendo necesario tratarla con su emisor.

## Comprobación manual con servicios de desarrollo

1. Aplicar el esquema completo, cargar catálogo y verificar acceso denegado con anon key a conversaciones/mensajes y RPC privados.
2. Abrir dos navegadores independientes: cada sesión debe recuperar únicamente su historial.
3. Verificar modelos disponibles y generar una respuesta sobre un producto real del catálogo; revisar precio y stock.
4. Enviar un webhook firmado con el token Bearer configurado y luego repetir el mismo ID; confirmar una sola respuesta.
5. Probar un token falso y una instancia distinta; no deben producir llamadas a Gemini ni envíos.
6. Simular error/timeout de Evolution; revisar el evento pendiente y conciliar sin reenvío ciego.
7. Solicitar un asesor, verificar que no hay nuevas respuestas automáticas y responder por web o Evolution según canal.
8. Ejecutar mantenimiento con datos de prueba antiguos y comprobar los registros eliminados y la retención de backups.
