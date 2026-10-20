"use client";

import { useActionState } from "react";
import { responderAviso } from "@/lib/acciones";
import { Button } from "@/components/shadcn/button";

export function FormAviso({ id }: { id: string }) {
  const [estado, accion, enviando] = useActionState(responderAviso, null);
  return (
    <form action={accion} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="respuesta"
        required
        rows={3}
        aria-label="Tu respuesta"
        placeholder="Tu respuesta"
        className="w-full rounded-md border border-border bg-card p-4 text-base focus-visible:outline-2 focus-visible:outline-ring"
      />
      {estado?.error && <p role="alert" className="font-medium text-destructive">{estado.error}</p>}
      <Button type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar respuesta"}</Button>
    </form>
  );
}
