import type { Metadata } from "next";
import { HeartPulse } from "lucide-react";
import { Proximamente } from "@/components/app/Proximamente";

export const metadata: Metadata = { title: "Salud" };

export default function Pagina() {
  return <Proximamente titulo="Salud" icono={HeartPulse} texto="Tu estado de salud de un vistazo, histórico y resumen diario." />;
}
