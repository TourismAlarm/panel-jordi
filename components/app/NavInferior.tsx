"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULOS, moduloActivo } from "@/config/modulos";
import { cn } from "@/lib/utils";

export function NavInferior() {
  const activo = moduloActivo(usePathname())?.id;
  return (
    <nav
      aria-label="Módulos"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {MODULOS.filter((m) => m.barra).map((m) => {
        const Icono = m.icono;
        const on = activo === m.id;
        return (
          <Link
            key={m.id}
            href={m.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex h-[var(--alto-pestanas)] flex-1 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold active:scale-95",
              on ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span className={cn("flex h-8 w-14 items-center justify-center rounded-full", on && "bg-muted")}>
              <Icono size={24} strokeWidth={on ? 2.6 : 2} />
            </span>
            {m.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
