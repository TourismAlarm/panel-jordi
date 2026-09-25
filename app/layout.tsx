import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "./nav";

export const metadata: Metadata = {
  title: "Panel ELSA",
  description: "Preguntas y guiones de los vídeos de ELSA",
  appleWebApp: { capable: true, title: "Panel ELSA", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
