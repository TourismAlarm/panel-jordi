"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { pedirLectura } from "@/lib/documentos/acciones";

// Vuelve a pedir a Antonio que lo lea el bot Documentos. La ficha llega al rato, no al momento.
export function BotonLeer({ id }: { id: string }) {
  const [pendiente, empezar] = useTransition();
  const [estado, setEstado] = useState<{ texto: string; error?: boolean } | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pendiente}
        aria-busy={pendiente}
        onClick={() =>
          empezar(async () => {
            setEstado(null);
            const r = await pedirLectura(id);
            setEstado(r?.error ? { texto: r.error, error: true } : { texto: "Avisado. El bot Documentos lo leerá y dejará la ficha." });
          })
        }
      >
        <Send size={18} />
        {pendiente ? "Avisando…" : "Pedir a Antonio que lo lea"}
      </Button>
      {estado && <p role={estado.error ? "alert" : "status"} className={estado.error ? "font-semibold text-destructive" : "font-semibold"}>{estado.texto}</p>}
    </div>
  );
}
