import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Proximamente } from "@/components/app/Proximamente";

export const metadata: Metadata = { title: "Finanzas" };

export default function Pagina() {
  return <Proximamente titulo="Finanzas" icono={Wallet} texto="Gasto del mes, presupuesto, deudas y proyección." />;
}
