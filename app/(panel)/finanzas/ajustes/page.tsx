import type { Metadata } from "next";
import { Ajustes } from "@/components/finanzas/Ajustes";
import { ProveedorFinanzas } from "@/components/finanzas/ProveedorFinanzas";

export const metadata: Metadata = { title: "Ajustes de Finanzas" };

export default function AjustesFinanzas() {
  return (
    <ProveedorFinanzas>
      <Ajustes />
    </ProveedorFinanzas>
  );
}
