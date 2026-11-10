import Link from "next/link";
import type { Etapa } from "@/lib/pasos";

type Tramo = { id: Etapa; nombre: string; cuantos: number; teToca: boolean };

// El embudo de ELSA: cuántos vídeos hay en cada etapa. En color, las etapas donde algo te espera a ti.
// Tocar una etapa deja solo sus vídeos; tocarla otra vez vuelve a todos.
export function Embudo({ tramos, activa }: { tramos: Tramo[]; activa: Etapa | null }) {
  return (
    <nav aria-label="Vídeos por etapa" className="grid grid-cols-5 gap-1.5">
      {tramos.map((t) => {
        const on = activa === t.id;
        const color = t.teToca ? "var(--mod-elsa)" : "var(--texto)";
        return (
          <Link
            key={t.id}
            href={on ? "/elsa" : `/elsa?fase=${t.id}`}
            aria-current={on ? "true" : undefined}
            aria-label={`${t.nombre}: ${t.cuantos}${t.teToca ? ", te toca" : ""}`}
            className="flex min-w-0 flex-col items-center gap-0.5 rounded-lg border bg-card px-1 py-2.5 text-inherit no-underline active:scale-[0.97]"
            style={{ borderColor: on ? color : t.teToca ? `color-mix(in srgb, ${color} 55%, transparent)` : "var(--borde)", borderWidth: on ? 2 : 1, margin: on ? -1 : 0, opacity: t.cuantos ? 1 : 0.55 }}
          >
            <span className="text-2xl font-bold leading-none tabular-nums" style={{ color }}>{t.cuantos}</span>
            <span className="w-full truncate text-center text-xs font-semibold text-muted-foreground">{t.nombre}</span>
          </Link>
        );
      })}
    </nav>
  );
}
