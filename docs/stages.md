# Etapas de implementación

## 1. Cerrar exposiciones

Se reemplazó la página QR pública por instrucciones sin credenciales; se retiró el fallback a anon key del servidor y se cerraron grants/políticas abiertas. No se rotaron claves ni se reescribió Git. Aprende a distinguir eliminación del archivo actual, revocación y limpieza histórica.

## 2. Proteger los límites

Se agregaron autenticación de webhook/panel, sesión firmada, validación de JSON, límites de cuerpo/contexto/salida, cuotas compartidas y errores sin detalles privados. Las credenciales no se envían al modelo. Los IDs de modelos se contrastaron con documentación actual: el análisis anterior que cuestionaba `gemini-3.8-flash` no demostraba su invalidez.

## 3. Persistir y controlar efectos

El historial web ahora viene del servidor. Las conversaciones separan canales y usan leases para serializar turnos. WhatsApp registra IDs únicos antes del efecto externo y conserva los casos inciertos para conciliación. Ya no informa éxito si falla el envío.

## 4. Añadir un proceso comercial pequeño

El catálogo alimenta respuestas; palabras de intención comercial crean oportunidades. El equipo puede actualizar estados, ver historial, tomar la conversación y responder por web. La atención WhatsApp humana se realiza en Evolution mientras el bot está pausado. No es un CRM completo ni un checkout.

## 5. Hacer el resultado revisable

Pruebas de validación, API, servicio, deduplicación, motor SQL y navegador, junto con GitHub Actions y documentación. Se actualizó Next.js dentro de la versión mayor existente y se corrigieron dependencias vulnerables. La suite no necesita tokens externos. La integración productiva se verifica aparte, con configuración de desarrollo.
