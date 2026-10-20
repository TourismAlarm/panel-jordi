import type { Metadata } from "next";
import { CalendarCheck } from "lucide-react";
import { Proximamente } from "@/components/app/Proximamente";

export const metadata: Metadata = { title: "Hoy" };

export default function Hoy() {
  return <Proximamente titulo="Hoy" icono={CalendarCheck} texto="Tu resumen del día: prioridades, agenda, correos y alertas." />;
}
