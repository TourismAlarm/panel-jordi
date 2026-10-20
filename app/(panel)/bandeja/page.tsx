import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { FormAviso } from "@/components/app/FormAviso";
import { Badge } from "@/components/shadcn/badge";
import { Button } from "@/components/shadcn/button";
import { Card } from "@/components/shadcn/card";
import { leerAviso } from "@/lib/acciones";
import { listarBandeja } from "@/lib/datos/bandeja";
import { formatearFechaHora } from "@/lib/fechas";

export const metadata: Metadata = { title: "Bandeja" };

const TIPO = { aviso: "Aviso", pregunta: "Pregunta", borrador: "Borrador" } as const;

export default async function Bandeja() {
  const avisos = await listarBandeja();
  const nuevos = avisos.filter((a) => a.estado === "nuevo");
  const resto = avisos.filter((a) => a.estado !== "nuevo");

  return (
    <main className="mx-auto flex max-w-[var(--ancho)] flex-col gap-4 px-4 py-6">
      <h1 className="text-3xl font-bold">Bandeja</h1>
      {avisos.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <Inbox size={40} className="text-muted-foreground" />
          <p className="text-xl font-semibold">Todo al día</p>
          <p className="text-muted-foreground">Aquí llegarán los avisos y preguntas de tus automatizaciones.</p>
        </Card>
      )}
      {[...nuevos, ...resto].map((a) => (
        <Card key={a.id} className={`flex flex-col gap-3 ${a.estado === "nuevo" ? "border-primary border-2" : ""}`}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={a.estado === "nuevo" ? "default" : "secondary"}>{a.estado === "nuevo" ? "Nuevo" : a.estado === "leido" ? "Leído" : "Respondido"}</Badge>
            <Badge>{TIPO[a.tipo as keyof typeof TIPO] ?? a.tipo}</Badge>
            <span className="text-sm text-muted-foreground">{a.modulo} · {formatearFechaHora(a.created_at)}</span>
          </div>
          <h2 className="text-lg font-semibold">{a.titulo}</h2>
          {a.cuerpo && <p className="whitespace-pre-line">{a.cuerpo}</p>}
          {a.respuesta && <p className="rounded-md bg-muted p-3"><span className="font-semibold">Tu respuesta: </span>{a.respuesta}</p>}
          {a.tipo === "pregunta" && a.estado !== "respondido" && <FormAviso id={a.id} />}
          {a.tipo !== "pregunta" && a.estado === "nuevo" && (
            <form action={leerAviso}>
              <input type="hidden" name="id" value={a.id} />
              <Button variant="outline" size="sm" type="submit">Marcar como leído</Button>
            </form>
          )}
        </Card>
      ))}
    </main>
  );
}
