import type { Metadata } from "next";
import { FinanzasApp } from "@/components/finanzas/FinanzasApp";
import { ProveedorFinanzas } from "@/components/finanzas/ProveedorFinanzas";

export const metadata: Metadata = { title: "Finanzas" };

export default function Finanzas() {
  return (
    <ProveedorFinanzas>
      <FinanzasApp />
    </ProveedorFinanzas>
  );
}
