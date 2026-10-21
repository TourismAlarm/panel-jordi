"use client";

import { useActionState } from "react";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TODAS_CATEGORIAS } from "@/lib/documentos/categorias";
import { guardarFicha } from "@/lib/documentos/acciones";
import type { Documento, Ficha } from "@/lib/documentos/datos";

const campo = "flex flex-col gap-2";
const rotulo = "text-lg font-semibold";

type Importe = { concepto: string; importe: number };

export function FormFicha({ doc, ficha }: { doc: Documento; ficha: Ficha | null }) {
  const [estado, accion, enviando] = useActionState(guardarFicha, null);
  const importes = (Array.isArray(ficha?.importes) ? (ficha.importes as Importe[]) : []).map((i) => `${i.concepto}: ${String(i.importe).replace(".", ",")}`).join("\n");
  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={doc.id} />
      <label className={campo}>
        <span className={rotulo}>Categoría</span>
        <select name="categoria" defaultValue={doc.categoria} className="min-h-14 w-full rounded-md border border-border bg-card px-4 text-base">
          {TODAS_CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className={campo}>
        <span className={rotulo}>Tipo de documento</span>
        <Input name="tipo" defaultValue={doc.tipo ?? ""} placeholder="Ej. Póliza de seguro" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={campo}>
          <span className={rotulo}>Inicio</span>
          <Input type="date" name="inicio" defaultValue={ficha?.inicio ?? ""} />
        </label>
        <label className={campo}>
          <span className={rotulo}>Vencimiento</span>
          <Input type="date" name="vencimiento" defaultValue={ficha?.vencimiento ?? ""} />
        </label>
      </div>
      <label className={campo}>
        <span className={rotulo}>Partes (una por línea)</span>
        <textarea name="partes" rows={2} defaultValue={(ficha?.partes ?? []).join("\n")} className="w-full rounded-md border border-border bg-card p-4 text-base" />
      </label>
      <label className={campo}>
        <span className={rotulo}>Nº de referencia</span>
        <Input name="referencia" defaultValue={ficha?.referencia ?? ""} placeholder="Solo se guardan los últimos 4 caracteres" />
      </label>
      <label className={campo}>
        <span className={rotulo}>Importes (concepto: cantidad)</span>
        <textarea name="importes" rows={2} defaultValue={importes} placeholder="Prima anual: 412,50" className="w-full rounded-md border border-border bg-card p-4 text-base" />
      </label>
      <label className={campo}>
        <span className={rotulo}>Condiciones clave (máx. 3, una por línea)</span>
        <textarea name="condiciones" rows={3} defaultValue={(ficha?.condiciones ?? []).join("\n")} className="w-full rounded-md border border-border bg-card p-4 text-base" />
      </label>
      <label className={campo}>
        <span className={rotulo}>Contacto</span>
        <Input name="contacto" defaultValue={ficha?.contacto ?? ""} />
      </label>
      <Button type="submit" size="lg" disabled={enviando} aria-busy={enviando}>{enviando ? "Guardando…" : "Guardar ficha"}</Button>
      {estado?.ok && <p role="status" className="font-semibold">Guardado.</p>}
      {estado?.error && <p role="alert" className="font-semibold text-destructive">{estado.error}</p>}
    </form>
  );
}
