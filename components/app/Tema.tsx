"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Tema = "auto" | "claro" | "oscuro";
const OPCIONES: { id: Tema; texto: string; icono: typeof Sun }[] = [
  { id: "auto", texto: "Automático", icono: Monitor },
  { id: "claro", texto: "Claro", icono: Sun },
  { id: "oscuro", texto: "Oscuro", icono: Moon },
];

function aplicar(t: Tema) {
  const raiz = document.documentElement;
  if (t === "auto") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", t === "claro" ? "light" : "dark");
}

export function Tema() {
  const [tema, setTema] = useState<Tema>("auto");
  useEffect(() => {
    try {
      const guardado = localStorage.getItem("tema") as Tema | null;
      if (guardado) setTema(guardado);
    } catch {}
  }, []);

  const elegir = (t: Tema) => {
    setTema(t);
    aplicar(t);
    try {
      localStorage.setItem("tema", t);
    } catch {}
  };

  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
      {OPCIONES.map(({ id, texto, icono: Icono }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={tema === id}
          onClick={() => elegir(id)}
          className={cn(
            "flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border font-semibold",
            tema === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
          )}
        >
          <Icono size={22} />
          {texto}
        </button>
      ))}
    </div>
  );
}
