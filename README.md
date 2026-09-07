# AI Chat Assistant 🤖✨

Una aplicación web moderna, minimalista y modular de chat con Inteligencia Artificial, construida con **Next.js 15**, **React 19**, **Vercel AI SDK** y **Google Gemini**.

Este proyecto sirve como la **Fase 1** (fundación limpia y extensible) para el desarrollo progresivo de aplicaciones conversacionales inteligentes y agentes de IA.

---

## 🚀 Características Principales

* **Selector dinámico de motor de IA:** Permite alternar en caliente entre distintos modelos de Google Gemini directamente desde la interfaz:
  * **Gemini 3.8 Flash** *(Por defecto)*: Modelo de última generación, ultra rápido, eficiente e inteligente.
  * **Gemini 3.7 Flash**: Capacidades híbridas con razonamiento avanzado.
  * **Gemini 3.6 Flash**: Alta estabilidad para conversaciones cotidianas.
  * **Gemini 3.1 Pro (Preview)**: Máxima capacidad analítica y tareas complejas (requiere cuota Pro).
* **Arquitectura Full-Stack segura:** La comunicación con Google Gemini se realiza exclusivamente a través de Route Handlers del servidor (`/api/chat`), protegiendo tus credenciales de API para que nunca queden expuestas en el navegador del usuario.
* **Componentes UI especializados (AI Elements):** Interfaz construida con primitivas accesibles de Radix UI y Tailwind CSS v4, incluyendo:
  * Contenedor de conversación con scroll automático y botón de anclaje inferior.
  * Renderizado elegante de Markdown y formateo de texto en las respuestas del asistente.
  * Input de chat responsivo con soporte de atajos de teclado (`Enter` para enviar, `Shift + Enter` para salto de línea).
* **Validación preventiva y diagnóstico:** Detección automática de configuración faltante en `.env.local`, mostrando alertas legibles y accionables en lugar de errores crípticos.
* **Reinicio de sesión:** Botón rápido para limpiar la conversación y comenzar un nuevo hilo con un solo clic.

---

## 🛠️ Stack Tecnológico

| Capa / Herramienta | Tecnología |
| :--- | :--- |
| **Framework Full-Stack** | [Next.js 15](https://nextjs.org/) (App Router + Turbopack) |
| **Biblioteca de UI** | [React 19](https://react.dev/) |
| **SDK de Inteligencia Artificial** | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai` v5) |
| **Proveedor de Modelos** | [`@ai-sdk/google`](https://www.npmjs.com/package/@ai-sdk/google) (Google Gemini API) |
| **Estilos & Diseño** | [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **Componentes Accesibles** | [Radix UI](https://www.radix-ui.com/) & [AI Elements](https://ai-elements.dev/) |
| **Tooling & Formato** | [TypeScript](https://www.typescriptlang.org/) & [Biome](https://biomejs.dev/) |

---

## 📂 Estructura del Proyecto

```text
chatbot-ai-sdk-next-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          # Endpoint backend seguro que invoca a Gemini
│   │   ├── components/
│   │   │   ├── chat-header.tsx       # Cabecera con selector de modelo y reset de chat
│   │   │   ├── chat-input.tsx        # Entrada de texto y atajos de teclado
│   │   │   ├── chat-message.tsx      # Renderizado de mensajes y Markdown
│   │   │   └── model-selector.tsx    # Menú desplegable para alternar motores de IA
│   │   ├── hooks/
│   │   │   └── use-chat.ts           # Custom hook que gestiona el estado y peticiones
│   │   ├── layout.tsx                # Estructura base y fuentes tipográficas (Geist)
│   │   └── page.tsx                  # Vista principal de la aplicación
│   ├── components/
│   │   ├── ai-elements/              # Primitivas visuales para interfaces de chat/IA
│   │   └── ui/                       # Componentes base (Botones, Select, Inputs, etc.)
│   └── lib/
│       ├── consts.ts                 # Constantes de textos de interfaz
│       ├── models.ts                 # Catálogo centralizado de modelos Gemini
│       ├── prompts.ts                # Prompt de sistema del asistente
│       ├── types.ts                  # Tipos TypeScript compartidos
│       └── utils.ts                  # Utilidades de estilos (clsx + tailwind-merge)
├── .env.example                      # Plantilla de variables de entorno
├── .env.local                        # Clave de API local (ignorado en Git)
├── biome.json                        # Configuración de Biome (linter/formatter)
├── package.json                      # Dependencias y scripts
└── tsconfig.json                     # Configuración de TypeScript
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/Leracius/chatbot-ai-sdk-next-app.git
cd chatbot-ai-sdk-next-app
pnpm install
```

### 2. Configurar la API Key de Gemini

1. Obtén una clave de API gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Crea tu archivo `.env.local` a partir de `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
3. Pega tu clave en `.env.local`:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=tu_api_key_aqui
   ```

### 3. Ejecutar el entorno de desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para empezar a chatear.

---

## 📜 Scripts Disponibles

* `pnpm dev`: Inicia el servidor de desarrollo con Turbopack.
* `pnpm build`: Genera la compilación de producción optimizada.
* `pnpm start`: Inicia el servidor de producción tras compilar.
* `pnpm lint`: Ejecuta el análisis estático con Biome.
* `pnpm format`: Aplica formato automático de código con Biome.

---

## 🗺️ Hoja de Ruta (Futuras Fases)

* [ ] **Fase 2:** Implementar streaming de respuestas en tiempo real (`streamText` y SSE).
* [ ] **Fase 3:** Respuestas estructuradas con Zod (`generateObject`) y llamadas a herramientas (*Tool Calling*).
* [ ] **Fase 4:** Persistencia de historial de conversaciones (LocalStorage / Base de datos) y gestión de sesiones.
