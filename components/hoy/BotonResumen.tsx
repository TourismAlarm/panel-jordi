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
        {pendiente ? "Preparando… (puede tardar)" : "Actualizar el resumen"}
      </Button>
      {estado?.ok && <p role="status" className="text-sm font-semibold">Resumen actualizado.</p>}
      {estado?.error && <p role="alert" className="text-sm font-semibold text-destructive">{estado.error}</p>}
    </form>
  );
}
