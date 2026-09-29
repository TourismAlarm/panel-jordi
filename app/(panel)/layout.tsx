import type { ReactNode } from "react";
import { MarcoApp } from "@/components/app/MarcoApp";

// Todas las pantallas de dentro (con sesión) comparten el armazón con la barra de pestañas.
export default function LayoutPanel({ children }: { children: ReactNode }) {
  return <MarcoApp>{children}</MarcoApp>;
}
