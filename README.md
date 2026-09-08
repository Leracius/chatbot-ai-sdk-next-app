# AI Chat Assistant & WhatsApp Business Sales Bot 🤖✨

Una aplicación web moderna, minimalista y modular de chat con Inteligencia Artificial, construida con **Next.js 15**, **React 19**, **Vercel AI SDK**, **Google Gemini** y **Supabase (PostgreSQL)**, con soporte para canal Web y canal **WhatsApp Business** (mediante conexión QR).

---

## 🚀 Características Principales

* **Arquitectura Omnicanal Unificada (Web + WhatsApp):** El mismo asistente con sus 5 productos y reglas de venta atiende tanto en la interfaz web como por WhatsApp Business.
* **Memoria Persistente y CRM con Supabase:** Guarda las conversaciones organizadas por número de teléfono en PostgreSQL. Puedes ver todas las charlas de tus clientes directamente desde el dashboard visual de Supabase.
* **Conexión de WhatsApp por Código QR (Opción B):** Compatible con Evolution API / Baileys. Escaneas el QR desde la app de WhatsApp Business en tu celular, manteniendo tu aplicación móvil intacta y pudiendo intervenir manualmente cuando lo desees.
* **Filtros Anti-Bucles:** El webhook de WhatsApp detecta e ignora mensajes propios (`fromMe`) y estados/broadcasts.
* **Selector dinámico de motor de IA:** Permite alternar entre modelos Gemini (Gemini 3.8 Flash por defecto, 3.7 Flash, 3.6 Flash o 3.1 Pro).
* **Seguridad Full-Stack:** Las claves de API de Google, Supabase y WhatsApp nunca se exponen al navegador.

---

## 🛠️ Stack Tecnológico

| Capa / Herramienta | Tecnología |
| :--- | :--- |
| **Framework Full-Stack** | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) |
| **Biblioteca de UI** | [React 19](https://react.dev/) |
| **SDK de Inteligencia Artificial** | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` v5) |
| **Proveedor de Modelos** | [`@ai-sdk/google`](https://www.npmjs.com/package/@ai-sdk/google) (Google Gemini 3 Flash) |
| **Base de Datos & Memoria** | [Supabase](https://supabase.com/) (PostgreSQL) vía `@supabase/supabase-js` |
| **Canal WhatsApp** | Microservicio QR (Evolution API / Baileys Webhook) |
| **Estilos & Diseño** | [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **Componentes Accesibles** | [Radix UI](https://www.radix-ui.com/) & [AI Elements](https://ai-elements.dev/) |

---

## 📂 Estructura del Proyecto

```text
chatbot-ai-sdk-next-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts          # Endpoint para el chat web
│   │   │   └── whatsapp/
│   │   │       └── route.ts          # Webhook receptor de mensajes de WhatsApp
│   │   ├── components/               # Componentes UI (Header, Input, Message, ModelSelector)
│   │   ├── hooks/
│   │   │   └── use-chat.ts           # Hook de estado de chat web
│   │   ├── layout.tsx
│   │   └── page.tsx                  # Vista principal web
│   └── lib/
│       ├── chat-service.ts           # Servicio centralizado de IA (Web + WhatsApp)
│       ├── memory.ts                 # Funciones de historial y conversaciones en Supabase
│       ├── models.ts                 # Catálogo de modelos Gemini vigentes
│       ├── prompts.ts                # Prompt de sistema del vendedor
│       ├── supabase.ts               # Cliente singleton de Supabase
│       ├── types.ts                  # Tipos TypeScript compartidos
│       └── utils.ts
├── supabase_schema.sql               # Script SQL para inicializar Supabase
├── .env.example                      # Plantilla de variables de entorno
├── .env.local                        # Variables de entorno locales
├── package.json
└── tsconfig.json
```

---

## ⚙️ Puesta en Marcha

### 1. Variables de Entorno (`.env.local`)

```env
# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=tu_clave_de_gemini

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# WhatsApp Business QR (Evolution API)
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=tu_clave_de_evolution_api
WHATSAPP_INSTANCE_NAME=ventas-bot
```

### 2. Base de Datos
Copia el contenido de `supabase_schema.sql` y pégalo en el **SQL Editor** de tu proyecto en Supabase para crear las tablas `conversations` y `messages`.

### 3. Iniciar en Desarrollo
```bash
pnpm dev
```
Abre [http://localhost:3000](http://localhost:3000) para chatear en la web, o apunta el webhook de Evolution API hacia `/api/whatsapp`.
