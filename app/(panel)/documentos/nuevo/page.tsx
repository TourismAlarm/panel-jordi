import type { Metadata } from "next";
import Link from "next/link";
import { FormNota } from "@/components/documentos/FormNota";
import { Subir } from "@/components/documentos/Subir";
import { Card } from "@/components/shadcn/card";

export const metadata: Metadata = { title: "Añadir documento" };

export default function Nuevo() {
  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-6 px-4 py-5">
      <header>
        <Link href="/documentos" className="inline-flex min-h-12 items-center font-semibold underline">← Documentos</Link>
        <h1 className="text-3xl font-bold">Añadir</h1>
      </header>
      <section className="flex flex-col gap-3" aria-label="Subir archivos">
        <h2 className="text-xl font-bold">Subir archivos</h2>
        <Card><Subir /></Card>
        <p className="text-muted-foreground">Quedan guardados y privados. La tarea de Claude los lee y rellena la ficha (partes, vencimiento, importes…) en su próxima pasada.</p>
      </section>
      <section className="flex flex-col gap-3" aria-label="Nota de texto">
        <h2 className="text-xl font-bold">O apunta una nota</h2>
        <Card><FormNota /></Card>
      </section>
    </main>
  );
}
