import type { Metadata } from "next";
import { FormRegistro } from "@/components/salud/FormRegistro";

export const metadata: Metadata = { title: "Registrar salud" };

export default function Registrar() {
  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-5 px-4 py-5">
      <header>
        <h1 className="text-3xl font-bold">Registrar</h1>
        <p className="text-muted-foreground">Apunta solo lo que quieras. Lo de hoy se puede repetir y se sobrescribe.</p>
      </header>
      <FormRegistro />
    </main>
  );
}
