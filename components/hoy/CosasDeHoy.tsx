"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { Prioridad } from "@/lib/hoy/prioridades";
import { cn } from "@/lib/utils";

// `resuelta`: lo que el panel sabe de la cosa enlazada (true = ya la has hecho en su página, null = no lo puede saber).
export type Cosa = Prioridad & { resuelta: boolean | null };

// Las cosas de hoy que decide Antonio: las que hagan falta, sin tope.
// Se tachan solas cuando resuelves lo enlazado en su página (aprobar un montaje, contestar preguntas, leer la bandeja).
// También a mano, tocando el círculo: eso manda sobre lo automático y se recuerda en este móvil, solo para ese día.
export function CosasDeHoy({ fecha, cosas, resumen, pie }: { fecha: string; cosas: Cosa[]; resumen: string; pie?: string | null }) {
  const clave = `hoy-marcas-${fecha}`;
  const [marcas, setMarcas] = useState<Record<string, boolean>>({});
  const estaHecha = (c: Cosa) => marcas[c.texto] ?? c.resuelta === true;

  useEffect(() => {
    try {
      const guardadas = JSON.parse(localStorage.getItem(clave) ?? "{}");
      if (guardadas && typeof guardadas === "object" && !Array.isArray(guardadas)) setMarcas(Object.fromEntries(Object.entries(guardadas).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>);
    } catch {
      // Sin almacenamiento (modo privado): se tacha igual, solo que no se recuerda.
    }
  }, [clave]);

  function alternar(c: Cosa) {
    setMarcas((antes) => {
      const ahora = { ...antes, [c.texto]: !(antes[c.texto] ?? c.resuelta === true) };
      try {
        localStorage.setItem(clave, JSON.stringify(ahora));
      } catch {}
      return ahora;
    });
  }

  const deHoy = cosas.filter((c) => c.nivel !== "futuro");
  const luego = cosas.filter((c) => c.nivel === "futuro");
  const quedan = deHoy.filter((c) => !estaHecha(c)).length;

  const fila = (c: Cosa, i: number) => {
    const hecha = estaHecha(c);
    const sola = hecha && c.resuelta === true && marcas[c.texto] === undefined;
    const texto = (
      <span className={cn("text-base font-medium leading-snug", hecha && "line-through opacity-50")}>
        {c.nivel === "urgente" && !hecha && <span className="mr-2 rounded-full bg-destructive px-1.5 py-px align-[1px] text-[0.65rem] font-bold uppercase tracking-wide text-white">Urgente</span>}
        {c.texto}
        {c.enlace && <ChevronRight size={16} className="ml-0.5 inline align-[-3px] opacity-60" aria-hidden />}
        {sola && <span className="ml-2 inline-block text-xs font-semibold no-underline">Hecho en su página</span>}
      </span>
    );
    return (
      <li key={`${i}-${c.texto}`} className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => alternar(c)}
          aria-pressed={hecha}
          aria-label={hecha ? `Desmarcar: ${c.texto}` : `Marcar como hecho: ${c.texto}`}
          className="-m-2.5 flex size-10 shrink-0 items-center justify-center"
        >
          <span className={cn("flex size-5 items-center justify-center rounded-full border-2 border-current", hecha ? "bg-background text-foreground" : "opacity-60")}>
            {hecha && <Check size={13} strokeWidth={3.5} />}
          </span>
        </button>
        {c.enlace ? (
          c.enlace.startsWith("/") ? (
            <Link href={c.enlace} className="min-w-0 flex-1 text-inherit no-underline">{texto}</Link>
          ) : (
            <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 text-inherit no-underline">{texto}</a>
          )
        ) : (
          <span className="min-w-0 flex-1">{texto}</span>
        )}
      </li>
    );
  };

  return (
    <section aria-label="Tus cosas de hoy" className="flex flex-col gap-3 rounded-lg bg-foreground px-4 py-3.5 text-background">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-bold uppercase tracking-wider opacity-70">Tus cosas de hoy</h2>
        {deHoy.length > 0 && <p className="text-xs font-semibold tabular-nums opacity-70">{quedan === 0 ? "Todo hecho" : `Quedan ${quedan} de ${deHoy.length}`}</p>}
      </div>

      {deHoy.length > 0 ? <ul className="m-0 flex list-none flex-col gap-2.5 p-0">{deHoy.map(fila)}</ul> : <p className="text-base leading-snug">{resumen}</p>}

      {(luego.length > 0 || deHoy.length > 0) && (
        <div className="flex flex-col border-t border-background/20 pt-1 text-sm">
          {luego.length > 0 && (
            <details>
              <summary className="flex min-h-9 cursor-pointer items-center font-semibold opacity-80">Más adelante ({luego.length})</summary>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0 pb-2 pt-1">{luego.map(fila)}</ul>
            </details>
          )}
          {deHoy.length > 0 && (
            <details>
              <summary className="flex min-h-9 cursor-pointer items-center font-semibold opacity-80">Leer el resumen de Antonio</summary>
              <p className="pb-1 text-[0.95rem] leading-relaxed opacity-90">{resumen}</p>
              {pie && <p className="pb-1 text-xs opacity-60">{pie}</p>}
            </details>
          )}
        </div>
      )}
      {deHoy.length === 0 && pie && <p className="text-xs opacity-60">{pie}</p>}
    </section>
  );
}
