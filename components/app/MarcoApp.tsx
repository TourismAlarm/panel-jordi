import type { ReactNode } from "react";
import Link from "next/link";
import { Inbox, Settings } from "lucide-react";
import { contarNuevos } from "@/lib/datos/bandeja";
import { NavInferior } from "./NavInferior";
import { NavLateral } from "./NavLateral";
import { Buscador } from "./Buscador";
import { RegistroSW } from "./RegistroSW";

// Armazón de la app con sesión: lateral en escritorio, cabecera + barra inferior en móvil.
export async function MarcoApp({ children }: { children: ReactNode }) {
  const nuevos = await contarNuevos().catch(() => 0);
  return (
    <div className="min-h-dvh md:pl-64">
      <NavLateral nuevos={nuevos} />
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
        <span className="text-lg font-bold">Panel Jordi</span>
        <div className="flex items-center">
          <Link href="/bandeja" aria-label={`Bandeja${nuevos ? `, ${nuevos} nuevos` : ""}`} className="relative flex size-12 items-center justify-center">
            <Inbox size={26} />
            {nuevos > 0 && (
              <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {nuevos > 9 ? "9+" : nuevos}
              </span>
            )}
          </Link>
          <Link href="/ajustes" aria-label="Ajustes" className="flex size-12 items-center justify-center">
            <Settings size={26} />
          </Link>
        </div>
      </header>
      <div className="pb-[calc(var(--alto-pestanas)+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <NavInferior />
      <Buscador />
      <RegistroSW />
    </div>
  );
}
