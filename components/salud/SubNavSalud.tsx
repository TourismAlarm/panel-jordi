"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/salud", texto: "Hoy" },
  { href: "/salud/historico", texto: "Histórico" },
  { href: "/salud/registrar", texto: "Registrar" },
];

export function SubNavSalud() {
  const ruta = usePathname();
  return (
    <nav aria-label="Salud" className="mx-auto flex max-w-[var(--ancho)] gap-2 overflow-x-auto px-4 pt-3">
      {SECCIONES.map((s) => {
        const on = s.href === "/salud" ? ruta === "/salud" : ruta.startsWith(s.href);
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex min-h-12 shrink-0 items-center rounded-full border px-5 font-semibold",
              on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground",
            )}
          >
            {s.texto}
          </Link>
        );
      })}
    </nav>
  );
}
