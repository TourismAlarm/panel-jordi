"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MODULOS, SISTEMA } from "@/config/modulos";
import { ELSA_SECCIONES } from "@/config/elsa";

const DESTINOS = [
  ...MODULOS.map((m) => ({ texto: m.nombre, detalle: m.descripcion, href: m.href })),
  ...ELSA_SECCIONES.map((s) => ({ texto: `ELSA · ${s.texto}`, detalle: "", href: s.href })),
  ...SISTEMA.map((m) => ({ texto: m.nombre, detalle: m.descripcion, href: m.href })),
];

const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Buscador rápido (escritorio): «/» o Ctrl/Cmd+K. Hoy busca páginas; los documentos se añadirán en su fase.
export function Buscador() {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  const resultados = useMemo(() => {
    const n = normal(q.trim());
    return DESTINOS.filter((d) => !n || normal(`${d.texto} ${d.detalle}`).includes(n));
  }, [q]);

  useEffect(() => {
    const abrir = () => {
      setQ("");
      setSel(0);
      ref.current?.showModal();
    };
    const tecla = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const escribiendo = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !escribiendo)) {
        e.preventDefault();
        abrir();
      }
    };
    window.addEventListener("keydown", tecla);
    window.addEventListener("abrir-buscador", abrir);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("abrir-buscador", abrir);
    };
  }, []);

  const ir = (href: string) => {
    ref.current?.close();
    router.push(href);
  };

  return (
    <dialog ref={ref} className="m-auto w-full max-w-lg rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/50">
      <input
        autoFocus
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setSel((s) => Math.min(s + 1, resultados.length - 1));
          if (e.key === "ArrowUp") setSel((s) => Math.max(s - 1, 0));
          if (e.key === "Enter" && resultados[sel]) ir(resultados[sel].href);
        }}
        placeholder="Ir a…"
        aria-label="Buscar"
        className="min-h-14 w-full border-b border-border bg-transparent px-4 text-lg outline-none"
      />
      <ul className="max-h-80 overflow-auto p-2">
        {resultados.length === 0 && <li className="p-3 text-muted-foreground">Nada encontrado</li>}
        {resultados.map((d, i) => (
          <li key={d.href + d.texto}>
            <button
              type="button"
              onClick={() => ir(d.href)}
              onMouseEnter={() => setSel(i)}
              className={`flex min-h-12 w-full items-center justify-between rounded-md px-3 text-left ${i === sel ? "bg-muted" : ""}`}
            >
              <span className="font-semibold">{d.texto}</span>
              <span className="text-sm text-muted-foreground">{d.detalle}</span>
            </button>
          </li>
        ))}
      </ul>
    </dialog>
  );
}
