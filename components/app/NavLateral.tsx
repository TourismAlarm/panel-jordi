"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { MODULOS, SISTEMA, moduloActivo } from "@/config/modulos";
import { cn } from "@/lib/utils";

export function NavLateral({ nuevos }: { nuevos: number }) {
  const activo = moduloActivo(usePathname())?.id;
  const filas = [...MODULOS, ...SISTEMA];
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-2 border-r border-border bg-card p-4 md:flex">
      <p className="px-3 py-2 text-xl font-bold">Panel Jordi</p>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("abrir-buscador"))}
        className="flex min-h-12 items-center gap-3 rounded-md border border-border px-3 text-muted-foreground"
      >
        <Search size={20} />
        <span className="flex-1 text-left">Buscar</span>
        <kbd className="rounded border border-border px-1.5 text-sm">/</kbd>
      </button>
      <nav aria-label="Módulos" className="mt-2 flex flex-col gap-1">
        {filas.map((m) => {
          const Icono = m.icono;
          const on = activo === m.id;
          return (
            <Link
              key={m.id}
              href={m.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-semibold",
                on ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
              )}
            >
              <Icono size={22} />
              <span className="flex-1">{m.nombre}</span>
              {m.id === "bandeja" && nuevos > 0 && (
                <span className={cn("rounded-full px-2 text-sm font-bold", on ? "bg-primary-foreground text-primary" : "bg-primary text-primary-foreground")}>
                  {nuevos}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
