"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { actualizarResumen } from "@/lib/hoy/acciones";

export function BotonResumen() {
  const [estado, accion, pendiente] = useActionState(actualizarResumen, null);
  return (
    <form action={accion} className="flex flex-col gap-2">
      <Button type="submit" variant="outline" size="sm" disabled={pendiente} aria-busy={pendiente}>
        <Sparkles size={18} />
        {pendiente ? "Avisando a Antonio…" : "Pedir el resumen a Antonio"}
      </Button>
      {estado && "avisado" in estado && (
        <p role="status" className="text-sm font-semibold">
          {estado.avisado ? "Antonio lo está preparando. Tardará un rato: recarga la página para verlo." : "Antonio no responde. Si no tenías uno suyo de hoy, tienes el resumen sencillo."}
        </p>
      )}
      {estado && "error" in estado && <p role="alert" className="text-sm font-semibold text-destructive">{estado.error}</p>}
    </form>
  );
}
