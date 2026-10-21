"use client";

import { useActionState, useState } from "react";
import { guardarRegistro } from "@/lib/salud/acciones";
import { ETIQUETAS_SINTOMA, necesitaAvisoMedico } from "@/lib/salud/seguridad";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { AvisoMedico } from "./AvisoMedico";
import { cn } from "@/lib/utils";

function Escala({ nombre, etiqueta }: { nombre: string; etiqueta: string }) {
  const [v, setV] = useState("");
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-lg font-semibold">{etiqueta}</legend>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={cn("flex min-h-14 cursor-pointer items-center justify-center rounded-md border text-xl font-bold", v === String(n) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
            <input type="radio" name={nombre} value={n} checked={v === String(n)} onChange={() => setV(String(n))} className="sr-only" />
            {n}
          </label>
        ))}
      </div>
      <p className="flex justify-between text-sm text-muted-foreground"><span>1 = mal</span><span>5 = genial</span></p>
    </fieldset>
  );
}

export function FormRegistro() {
  const [estado, accion, enviando] = useActionState(guardarRegistro, null);
  const [sintoma, setSintoma] = useState("");
  const [intensidad, setIntensidad] = useState("");
  const [texto, setTexto] = useState("");
  const [condicion, setCondicion] = useState("");

  // Aviso en directo, antes de guardar
  const avisoYa =
    (sintoma !== "" && necesitaAvisoMedico({ tipo: "sintoma", etiqueta: sintoma, texto, intensidad: intensidad ? Number(intensidad) : null })) ||
    condicion.trim() !== "" ||
    (texto !== "" && necesitaAvisoMedico({ tipo: "nota", texto }));

  return (
    <form action={accion} className="flex flex-col gap-6">
      <Escala nombre="animo" etiqueta="Ánimo" />
      <Escala nombre="energia" etiqueta="Energía" />

      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Peso (kg)</span>
        <Input name="peso" inputMode="decimal" placeholder="Ej. 78,4" />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-semibold">¿Algún síntoma?</legend>
        <div className="flex flex-wrap gap-2">
          {ETIQUETAS_SINTOMA.map((e) => (
            <label key={e.id} className={cn("flex min-h-12 cursor-pointer items-center rounded-full border px-4 font-semibold", sintoma === e.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
              <input type="radio" name="sintoma" value={e.id} checked={sintoma === e.id} onChange={() => setSintoma(sintoma === e.id ? "" : e.id)} onClick={() => sintoma === e.id && setSintoma("")} className="sr-only" />
              {e.texto}
            </label>
          ))}
        </div>
        {sintoma && (
          <label className="mt-2 flex flex-col gap-2">
            <span className="font-semibold">Intensidad (1 leve – 5 muy fuerte)</span>
            <Input name="intensidad" inputMode="numeric" value={intensidad} onChange={(e) => setIntensidad(e.target.value)} placeholder="1 a 5" />
          </label>
        )}
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Condición médica (si te han diagnosticado algo)</span>
        <Input name="condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)} placeholder="Ej. hipertensión, asma…" />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Nota</span>
        <textarea name="nota" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cómo te has sentido hoy" className="w-full rounded-md border border-border bg-card p-4 text-base focus-visible:outline-2 focus-visible:outline-ring" />
      </label>

      {(avisoYa || estado?.avisoMedico) && <AvisoMedico />}
      {estado?.error && <p role="alert" className="font-semibold text-destructive">{estado.error}</p>}
      {estado?.ok && <p role="status" className="font-semibold">Guardado ✓</p>}
      <Button type="submit" size="lg" disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</Button>
    </form>
  );
}
