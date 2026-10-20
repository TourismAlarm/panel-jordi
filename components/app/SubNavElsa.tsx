"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ELSA_SECCIONES } from "@/config/elsa";
import { cn } from "@/lib/utils";

export function SubNavElsa() {
  const ruta = usePathname();
  return (
    <nav aria-label="ELSA" className="mx-auto flex max-w-[var(--ancho)] gap-2 overflow-x-auto px-4 pt-3">
      {ELSA_SECCIONES.map((s) => {
        const on = s.href === "/elsa" ? ruta === "/elsa" || ruta.startsWith("/elsa/videos") || ruta.startsWith("/elsa/nuevo") : ruta.startsWith(s.href);
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
