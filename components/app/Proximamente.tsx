import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/shadcn/card";

export function Proximamente({ titulo, icono: Icono, texto }: { titulo: string; icono: LucideIcon; texto: string }) {
  return (
    <main className="mx-auto flex min-h-[70dvh] max-w-[var(--ancho)] flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <Card className="flex flex-col items-center gap-3 py-10 text-center">
        <Icono size={40} className="text-muted-foreground" />
        <p className="text-xl font-semibold">Próximamente</p>
        <p className="text-muted-foreground">{texto}</p>
      </Card>
    </main>
  );
}
