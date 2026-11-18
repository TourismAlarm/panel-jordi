"use client";

import type { MouseEvent, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ETAPAS, type Etapa } from "@/lib/pasos";

type Tramo = { id: Etapa; nombre: string; cuantos: number; teToca: boolean };

// La etapa elegida vive en la URL (?fase=…). Se cambia con history.pushState, que Next sincroniza con useSearchParams:
// así el cambio es instantáneo y no espera a que el servidor vuelva a leer todos los datos de la portada
// (antes cada toque era una navegación entera y, mientras cargaba, la pantalla no cambiaba nada).
function useFase(): Etapa | null {
  const q = useSearchParams().get("fase");
  return ETAPAS.find((e) => e.id === q)?.id ?? null;
}

function hrefDe(params: URLSearchParams, fase: Etapa | null) {
  const p = new URLSearchParams(params.toString());
  if (fase) p.set("fase", fase);
  else p.delete("fase");
  const q = p.toString();
  return q ? `/elsa?${q}` : "/elsa";
}

function useIrA() {
  const params = useSearchParams();
  return {
    href: (fase: Etapa | null) => hrefDe(params, fase),
    ir: (e: MouseEvent<HTMLAnchorElement>, fase: Etapa | null) => {
      // Ctrl/Cmd/Mayús o botón central: que el navegador abra la pestaña nueva como siempre.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      window.history.pushState(null, "", hrefDe(params, fase));
      window.scrollTo({ top: 0 });
    },
  };
}

// El embudo de ELSA: cuántos vídeos hay en cada etapa. En color, las etapas donde algo te espera a ti.
// Tocar una etapa deja solo sus vídeos; tocarla otra vez vuelve a todos.
export function Embudo({ tramos }: { tramos: Tramo[] }) {
  const activa = useFase();
  const { href, ir } = useIrA();
  return (
    <nav aria-label="Vídeos por etapa" className="grid grid-cols-5 gap-1.5">
      {tramos.map((t) => {
        const on = activa === t.id;
        const destino = on ? null : t.id;
        const color = t.teToca ? "var(--mod-elsa)" : "var(--texto)";
        return (
          <a
            key={t.id}
            href={href(destino)}
            onClick={(e) => ir(e, destino)}
            aria-current={on ? "true" : undefined}
            aria-label={`${t.nombre}: ${t.cuantos}${t.teToca ? ", te toca" : ""}`}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg border bg-card px-1 py-2.5 text-inherit no-underline active:scale-[0.97]"
            style={{ borderColor: on ? color : t.teToca ? `color-mix(in srgb, ${color} 55%, transparent)` : "var(--borde)", borderWidth: on ? 2 : 1, margin: on ? -1 : 0, opacity: t.cuantos ? 1 : 0.55 }}
          >
            <span className="text-2xl font-bold leading-none tabular-nums" style={{ color }}>{t.cuantos}</span>
            <span className="w-full truncate text-center text-xs font-semibold text-muted-foreground">{t.nombre}</span>
          </a>
        );
      })}
    </nav>
  );
}

// Lo que se ve debajo según la etapa elegida. El servidor manda ya hecha la vista de cada etapa y la de «todo».
export function VistaEmbudo({ todo, etapas }: { todo: ReactNode; etapas: Record<Etapa, ReactNode> }) {
  const activa = useFase();
  return <>{activa ? etapas[activa] : todo}</>;
}

// «Ver todo» dentro de una etapa: quita el filtro al instante, igual que volver a tocar la etapa.
export function VerTodo({ className }: { className?: string }) {
  const { href, ir } = useIrA();
  return (
    <a href={href(null)} onClick={(e) => ir(e, null)} className={className}>
      Ver todo
    </a>
  );
}
