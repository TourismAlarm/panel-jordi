import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/shadcn/card";
import type { Senal } from "@/lib/hoy/senales";
import { cn } from "@/lib/utils";

const ROTULO = { elsa: "ELSA", finanzas: "Finanzas", salud: "Salud", agenda: "Agenda", correo: "Correo", sistema: "Sistema" } as const;

function Fila({ s, urgente }: { s: Senal; urgente?: boolean }) {
  const cuerpo = (
    <div className="flex min-h-14 items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-muted-foreground">{ROTULO[s.modulo]}</p>
        <p className={cn("text-lg font-semibold leading-snug", urgente && "text-destructive")}>{s.titulo}</p>
        {s.detalle && <p className="text-muted-foreground">{s.detalle}</p>}
      </div>
      {s.href && <ChevronRight className="shrink-0 text-muted-foreground" size={22} aria-hidden />}
    </div>
  );
  return s.href ? (
    <Link href={s.href} className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      {cuerpo}
    </Link>
  ) : (
    cuerpo
  );
}

export function ListaSenales({ titulo, senales, urgente, plegable, abiertas = 3 }: { titulo: string; senales: Senal[]; urgente?: boolean; plegable?: boolean; abiertas?: number }) {
  if (!senales.length) return null;
  const vistas = plegable ? senales.slice(0, abiertas) : senales;
  const resto = plegable ? senales.slice(abiertas) : [];
  return (
    <section className="flex flex-col gap-2" aria-label={titulo}>
      <h2 className={cn("text-xl font-bold", urgente && "text-destructive")}>{titulo}</h2>
      <Card className={cn("flex flex-col divide-y divide-border py-1", urgente && "border-destructive/50")}>
        {vistas.map((s) => (
          <div key={s.id} className="py-2">
            <Fila s={s} urgente={urgente} />
          </div>
        ))}
        {resto.length > 0 && (
          <details className="py-2">
            <summary className="flex min-h-12 cursor-pointer items-center font-semibold">Ver {resto.length} más</summary>
            <div className="flex flex-col divide-y divide-border">
              {resto.map((s) => (
                <div key={s.id} className="py-2">
                  <Fila s={s} />
                </div>
              ))}
            </div>
          </details>
        )}
      </Card>
    </section>
  );
}
