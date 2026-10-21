"use client";

import { useActionState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { crearNota } from "@/lib/documentos/acciones";

export function FormNota() {
  const [estado, accion, enviando] = useActionState(crearNota, null);
  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Título</span>
        <Input name="nombre" required maxLength={200} placeholder="Ej. Códigos de la nave" />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-lg font-semibold">Texto</span>
        <textarea name="texto" required rows={8} maxLength={20000} className="w-full rounded-md border border-border bg-card p-4 text-base" />
      </label>
      <Button type="submit" size="lg" disabled={enviando} aria-busy={enviando}>{enviando ? "Guardando…" : "Guardar nota"}</Button>
      {estado?.error && <p role="alert" className="font-semibold text-destructive">{estado.error}</p>}
    </form>
  );
}
