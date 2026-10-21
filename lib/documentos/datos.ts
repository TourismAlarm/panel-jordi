import "server-only";
import { cache } from "react";
import { supabaseServidor } from "@/lib/supabase/server";
import type { Fila } from "@/lib/supabase/tipos";

export type Documento = Fila<"doc_documentos">;
export type Ficha = Fila<"doc_fichas">;
export type Pagina = Fila<"doc_paginas">;
export type DocConVencimiento = Documento & { vencimiento: string | null };

function fallo(que: string, e: { message: string }): never {
  console.error(`Documentos · ${que}:`, e.message);
  throw new Error(`No se han podido leer ${que}.`);
}

// Todos los documentos con su fecha de vencimiento (si la tienen).
export const listarDocumentos = cache(async (): Promise<DocConVencimiento[]> => {
  const supabase = await supabaseServidor();
  const [d, f] = await Promise.all([
    supabase.from("doc_documentos").select("*").order("subido_en", { ascending: false }).limit(1000),
    supabase.from("doc_fichas").select("documento_id, vencimiento"),
  ]);
  if (d.error) fallo("los documentos", d.error);
  if (f.error) fallo("las fichas", f.error);
  const venc = new Map((f.data ?? []).map((x) => [x.documento_id, x.vencimiento]));
  return (d.data ?? []).map((x) => ({ ...x, vencimiento: venc.get(x.id) ?? null }));
});

export type Detalle = { doc: Documento; ficha: Ficha | null; paginas: Pagina[]; url: string | null };

export async function obtenerDetalle(id: string): Promise<Detalle | null> {
  const supabase = await supabaseServidor();
  const [d, f, p] = await Promise.all([
    supabase.from("doc_documentos").select("*").eq("id", id).maybeSingle(),
    supabase.from("doc_fichas").select("*").eq("documento_id", id).maybeSingle(),
    supabase.from("doc_paginas").select("*").eq("documento_id", id).order("pagina"),
  ]);
  if (d.error) fallo("el documento", d.error);
  if (!d.data) return null;
  let url: string | null = null;
  if (d.data.ruta) {
    const s = await supabase.storage.from("documentos").createSignedUrl(d.data.ruta, 600); // enlace que caduca a los 10 min
    url = s.data?.signedUrl ?? null;
  }
  return { doc: d.data, ficha: f.data ?? null, paginas: p.data ?? [], url };
}

export type Coincidencia = { documento_id: string; pagina: number; extracto: string };

// Búsqueda de texto completo en español sobre el texto de las páginas (Postgres, tsvector).
export async function buscarEnDocumentos(q: string): Promise<Coincidencia[]> {
  const limpio = q.trim().slice(0, 200);
  if (!limpio) return [];
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.rpc("doc_buscar", { q: limpio });
  if (error) fallo("la búsqueda", error);
  return data ?? [];
}
