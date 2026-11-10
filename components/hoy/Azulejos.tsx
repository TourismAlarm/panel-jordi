import Link from "next/link";
import { FileText, HeartPulse, Truck, Wallet, type LucideIcon } from "lucide-react";
import type { Azulejos as Datos } from "@/lib/hoy/reunir";

const eur = (n: number) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

type Azulejo = { href: string; nombre: string; color: string; icono: LucideIcon; valor: string; detalle: string };

// El número clave de cada módulo. Tocar uno lleva a su sección.
export function Azulejos({ datos }: { datos: Datos }) {
  const f = datos.finanzas;
  const lista: Azulejo[] = [
    {
      href: "/salud",
      nombre: "Salud",
      color: "var(--mod-salud)",
      icono: HeartPulse,
      valor: datos.salud?.valor ?? "—",
      detalle: datos.salud ? `${datos.salud.nombre} · ${datos.salud.detalle}` : "Sin datos del reloj",
    },
    {
      href: "/finanzas",
      nombre: "Finanzas",
      color: "var(--mod-finanzas)",
      icono: Wallet,
      valor: f ? eur(f.restante) : "—",
      detalle: !f ? "Sin datos" : f.porDia !== null && f.diasNomina !== null ? `${eur(f.porDia)} al día · ${f.diasNomina} ${f.diasNomina === 1 ? "día" : "días"} a la nómina` : "Te quedan",
    },
    {
      href: "/elsa",
      nombre: "ELSA",
      color: "var(--mod-elsa)",
      icono: Truck,
      valor: datos.elsa === null ? "—" : String(datos.elsa),
      detalle: datos.elsa === null ? "Sin datos" : datos.elsa === 0 ? "Nada te espera" : datos.elsa === 1 ? "vídeo te espera" : "vídeos te esperan",
    },
    {
      href: "/documentos",
      nombre: "Documentos",
      color: "var(--mod-documentos)",
      icono: FileText,
      valor: datos.documentos === null ? "—" : String(datos.documentos),
      detalle: datos.documentos === null ? "Sin datos" : datos.documentos === 0 ? "Nada vence este mes" : datos.documentos === 1 ? "vence en 30 días" : "vencen en 30 días",
    },
  ];
  return (
    <section aria-label="Cómo va cada cosa" className="grid grid-cols-2 gap-3">
      {lista.map((a) => {
        const Icono = a.icono;
        return (
          <Link key={a.href} href={a.href} className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-card p-3 text-inherit no-underline active:scale-[0.98]">
            <span className="flex items-center gap-2 text-sm font-bold" style={{ color: a.color }}>
              <span className="flex size-7 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${a.color} 16%, transparent)` }}>
                <Icono size={16} strokeWidth={2.4} />
              </span>
              {a.nombre}
            </span>
            <span className="text-2xl font-bold leading-tight tabular-nums">{a.valor}</span>
            <span className="text-sm leading-snug text-muted-foreground">{a.detalle}</span>
          </Link>
        );
      })}
    </section>
  );
}
