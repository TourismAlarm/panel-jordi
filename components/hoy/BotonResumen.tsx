"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import { enviarResumenAhora } from "@/lib/hoy/acciones";

export function BotonResumen() {
  const [estado, accion, pendiente] = useActionState(enviarResumenAhora, null);
  return (
    <form action={accion} className="flex flex-col gap-2">
      <Button type="submit" variant="outline" size="sm" disabled={pendiente} aria-busy={pendiente}>
        <Mail size={18} />
        {pendiente ? "Preparando…" : "Enviarme el resumen ahora"}
      </Button>
      {estado?.ok && <p role="status" className="text-sm font-semibold">Enviado a tu correo.</p>}
      {estado?.error && <p role="alert" className="text-sm font-semibold text-destructive">{estado.error}</p>}
    </form>
  );
}
