import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SalesFlow AI",
  description: "Asistente comercial con control humano",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="dark antialiased font-sans">{children}</body>
    </html>
  );
}
