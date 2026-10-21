import type { Metadata } from "next";
import { FinanzasApp } from "@/components/finanzas/FinanzasApp";
import { ProveedorFinanzas } from "@/components/finanzas/ProveedorFinanzas";

export const metadata: Metadata = { title: "Finanzas" };

export default async function Finanzas({ searchParams }: PageProps<"/finanzas">) {
  const { tab } = await searchParams;
  return (
    <ProveedorFinanzas>
      <FinanzasApp tabInicial={tab === "movements" || tab === "debts" ? tab : "home"} />
    </ProveedorFinanzas>
  );
}
