"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { preguntarDocumentos } from "@/lib/documentos/acciones";
import type { Respuesta } from "@/lib/documentos/chat";

type Mensaje = { pregunta: string; respuesta?: Respuesta; error?: string };

const EJEMPLOS = ["¿Cuándo vence el seguro del camión?", "¿Qué cubre mi póliza de hogar?", "¿Cuánto pago al año de seguros?"];

export function Chat() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pendiente, empezar] = useTransition();
  const fin = useRef<HTMLDivElement>(null);

  function enviar(p: string) {
    const q = p.trim();
    if (!q || pendiente) return;
    const historial = mensajes.flatMap((m) => (m.respuesta ? [{ pregunta: m.pregunta, respuesta: m.respuesta.texto }] : []));
    setMensajes((m) => [...m, { pregunta: q }]);
    setTexto("");
    empezar(async () => {
      const r = await preguntarDocumentos(q, historial);
      setMensajes((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, respuesta: r.respuesta, error: r.error } : x)));
      setTimeout(() => fin.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {mensajes.length === 0 && (
        <Card className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Pregúntame sobre tus documentos</p>
          <p className="text-muted-foreground">Respondo solo con lo que pone en ellos y te digo en qué documento y página lo he visto.</p>
          <div className="flex flex-col gap-2">
            {EJEMPLOS.map((e) => (
              <button key={e} type="button" onClick={() => enviar(e)} className="min-h-12 rounded-md border border-border px-4 text-left font-semibold">{e}</button>
            ))}
          </div>
        </Card>
      )}

      {mensajes.map((m, i) => (
        <div key={i} className="flex flex-col gap-2">
          <p className="ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-primary-foreground">{m.pregunta}</p>
          {m.error ? (
            <p role="alert" className="font-semibold text-destructive">{m.error}</p>
          ) : m.respuesta ? (
            <Card className="flex max-w-[95%] flex-col gap-3">
              {m.respuesta.tipo === "aclaracion" && <p className="text-sm font-semibold text-muted-foreground">Necesito que me aclares una cosa</p>}
              <p className="whitespace-pre-wrap text-lg leading-snug">{m.respuesta.texto}</p>
              {m.respuesta.citas.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-border pt-3">
                  <p className="text-sm font-semibold text-muted-foreground">Fuente</p>
                  {m.respuesta.citas.map((c, k) => (
                    <Link key={k} href={`/documentos/${c.documento_id}${c.pagina ? `#p${c.pagina}` : ""}`} className="min-h-12 content-center font-semibold underline">
                      {c.nombre}{c.pagina ? ` · pág. ${c.pagina}` : " · ficha"}
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <p className="text-muted-foreground" aria-live="polite">Buscando en tus documentos…</p>
          )}
        </div>
      ))}
      <div ref={fin} />

      <form onSubmit={(e) => { e.preventDefault(); enviar(texto); }} className="sticky bottom-20 flex gap-2 bg-background py-2 md:bottom-2">
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={500} placeholder="Escribe tu pregunta" aria-label="Pregunta" className="min-h-14 min-w-0 flex-1 rounded-md border border-border bg-card px-4 text-base" />
        <Button type="submit" size="icon" disabled={pendiente || !texto.trim()} aria-label="Enviar"><Send size={22} /></Button>
      </form>
      <p className="text-sm text-muted-foreground">Explico lo que dicen los documentos; no es asesoramiento legal.</p>
    </div>
  );
}
