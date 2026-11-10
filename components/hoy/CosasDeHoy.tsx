"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import type { Prioridad } from "@/lib/hoy/prioridades";
import { cn } from "@/lib/utils";

// Las cosas de hoy que decide Antonio: las que hagan falta, sin tope. Se tachan al tocar el círculo.
// Lo tachado se recuerda en este móvil y solo para ese día (no se guarda en el panel).
export function CosasDeHoy({ fecha, cosas, resumen, pie }: { fecha: string; cosas: Prioridad[]; resumen: string; pie?: string | null }) {
  const clave = `hoy-hechas-${fecha}`;
  const [hechas, setHechas] = useState<string[]>([]);

  useEffect(() => {
    try {
      const guardadas = JSON.parse(localStorage.getItem(clave) ?? "[]");
      if (Array.isArray(guardadas)) setHechas(guardadas.filter((x) => typeof x === "string"));
    } catch {
      // Sin almacenamiento (modo privado): se tacha igual, solo que no se recuerda.
    }
  }, [clave]);

  function alternar(texto: string) {
    setHechas((antes) => {
      const ahora = antes.includes(texto) ? antes.filter((x) => x !== texto) : [...antes, texto];
      try {
        localStorage.setItem(clave, JSON.stringify(ahora));
      } catch {}
      return ahora;
    });
  }

  const deHoy = cosas.filter((c) => c.nivel !== "futuro");
  const luego = cosas.filter((c) => c.nivel === "futuro");
  const quedan = deHoy.filter((c) => !hechas.includes(c.texto)).length;

  const fila = (c: Prioridad, i: number) => {
    const hecha = hechas.includes(c.texto);
    const texto = (
      <span className={cn("text-lg font-semibold leading-snug", hecha && "line-through opacity-50")}>
        {c.nivel === "urgente" && !hecha && <span className="mr-2 rounded-full bg-destructive px-2 py-0.5 align-middle text-xs font-bold uppercase tracking-wide text-white">Urgente</span>}
        {c.texto}
        {c.enlace && <ChevronRight size={18} className="ml-1 inline align-[-3px] opacity-60" aria-hidden />}
      </span>
    );
    return (
      <li key={`${i}-${c.texto}`} className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => alternar(c.texto)}
          aria-pressed={hecha}
          aria-label={hecha ? `Desmarcar: ${c.texto}` : `Marcar como hecho: ${c.texto}`}
          className="-m-2 flex size-11 shrink-0 items-center justify-center"
        >
          <span className={cn("flex size-6 items-center justify-center rounded-full border-2 border-current", hecha ? "bg-background text-foreground" : "opacity-60")}>
            {hecha && <Check size={16} strokeWidth={3} />}
          </span>
        </button>
        {c.enlace ? (
          c.enlace.startsWith("/") ? (
            <Link href={c.enlace} className="min-w-0 flex-1 py-0.5 text-inherit no-underline">{texto}</Link>
          ) : (
            <a href={c.enlace} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 py-0.5 text-inherit no-underline">{texto}</a>
          )
        ) : (
          <span className="min-w-0 flex-1 py-0.5">{texto}</span>
        )}
      </li>
    );
  };

  return (
    <section aria-label="Tus cosas de hoy" className="flex flex-col gap-4 rounded-[20px] bg-foreground p-5 text-background">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-70">Tus cosas de hoy</h2>
        {deHoy.length > 0 && <p className="text-sm font-semibold tabular-nums opacity-70">{quedan === 0 ? "Todo hecho" : `Quedan ${quedan} de ${deHoy.length}`}</p>}
      </div>

      {deHoy.length > 0 ? <ul className="m-0 flex list-none flex-col gap-3 p-0">{deHoy.map(fila)}</ul> : <p className="text-lg leading-snug">{resumen}</p>}

      {luego.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-background/20 pt-3">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">Más adelante</h3>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">{luego.map(fila)}</ul>
        </div>
      )}

      {deHoy.length > 0 && (
        <details className="border-t border-background/20 pt-3">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold opacity-80">Leer el resumen de Antonio</summary>
          <p className="pt-1 text-base leading-relaxed opacity-90">{resumen}</p>
        </details>
      )}
      {pie && <p className="text-sm opacity-60">{pie}</p>}
    </section>
  );
}
