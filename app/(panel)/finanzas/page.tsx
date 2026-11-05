import type { Metadata } from "next";
import { UltimoInforme } from "@/components/bots/UltimoInforme";
import { FinanzasApp } from "@/components/finanzas/FinanzasApp";
import { ProveedorFinanzas } from "@/components/finanzas/ProveedorFinanzas";

export const metadata: Metadata = { title: "Finanzas" };

export default async function Finanzas({ searchParams }: PageProps<"/finanzas">) {
  const { tab } = await searchParams;
  return (
    <>
      <div className="mx-auto max-w-[var(--ancho)] px-4 pt-5 empty:hidden">
        <UltimoInforme bot="finanzas" />
      </div>
      <ProveedorFinanzas>
        <FinanzasApp tabInicial={tab === "movements" || tab === "debts" ? tab : "home"} />
      </ProveedorFinanzas>
    </>
  );
}
