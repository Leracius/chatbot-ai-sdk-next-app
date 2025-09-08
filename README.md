This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

COMENTARIOS DE DESARROLLO:

-Comenzamos instalando las librerias y el sdk de ai elements

$npx ai-elements@latest

-instale luego el ai sdk provider, es necesario instalar uno
acrode al modelo de ia que se usa en el proyecto

$pnpm add @ai-sdk/google

-Una vez instalados se cro en la carpeta components, todos los componentes de la ui

-En la carpeta lib cree:
-utils.ts
-prompt.ts
-consts.ts

-----------BACKEND--------------------

-Genere la carpeta api dentro de app de la siguiente forma:
-new folder: api
-new file: generate/route.ts

-Dentro genere la funcion del POST

Hook use-zombie-game

Esta función useZombieGame es un custom hook de React que gestiona la lógica de un juego interactivo de zombies. Te explico paso a paso lo que hace:

Define estados internos

messages: Guarda el historial de mensajes del juego (usuario y asistente).
input: Guarda el texto que el usuario escribe.
isLoading: Indica si el juego está procesando una acción (cargando).
Función startGame

Marca el estado como cargando.
Llama a la API /api/generate-story para iniciar la historia.
Si la respuesta es exitosa, crea un mensaje inicial del asistente con la narrativa recibida y lo guarda en messages.
Si hay error, lo muestra en consola.
Al final, desactiva el estado de carga.
Función generateImage

Llama a la API /api/generate-image con un prompt para generar una imagen.
Si la respuesta es exitosa, actualiza el mensaje correspondiente agregando la imagen y marcando que ya no está cargando.
Si hay error, solo marca que la imagen terminó de cargar (aunque falló).
Función handleSubmit

Se ejecuta al enviar el formulario (cuando el usuario escribe algo).
Previene el comportamiento por defecto del formulario.
Si el input está vacío o está cargando, no hace nada.
Crea un mensaje de usuario y lo agrega a messages.
Llama a la API /api/generate-story con el mensaje del usuario y el historial de la conversación.
Si la respuesta es exitosa, crea un mensaje del asistente con la nueva narrativa y lo agrega a messages.
Llama a generateImage para generar la imagen asociada a ese mensaje.
Si hay error, lo muestra en consola.
Al final, desactiva el estado de carga.
Función handleInputChange

Actualiza el estado input cada vez que el usuario escribe en el textarea.
Retorna los estados y funciones

Devuelve los estados y funciones para que el componente que use este hook pueda acceder y utilizarlos.
Resumen:
Este hook gestiona el flujo de mensajes entre el usuario y el asistente, llama a APIs para generar narrativa e imágenes, y controla los estados de carga e input del juego.
