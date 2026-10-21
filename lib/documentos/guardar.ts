import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipos";
import { ultimos4, type CuerpoResultado } from "./contrato";

// Guarda lo leído de un documento (por la IA o por la tarea de Claude): estado, texto por página y ficha.
// Sirve con la sesión de Jordi (RLS) o con la service_role: siempre se escribe con el user_id del documento.
export async function guardarResultado(db: SupabaseClient<Database>, userId: string, c: CuerpoResultado): Promise<string | null> {
  const { id, categoria, tipo, paginas, ficha } = c;
  const a = await db.from("doc_documentos").update({ categoria, tipo: tipo ?? null, estado: "procesado", error: null, procesado_en: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
  if (a.error) return "no se pudo guardar";
  if (paginas.length) {
    const p = await db.from("doc_paginas").upsert(paginas.map((x) => ({ documento_id: id, user_id: userId, pagina: x.pagina, texto: x.texto })), { onConflict: "documento_id,pagina" });
    if (p.error) return "no se pudo guardar el texto";
  }
  const f = await db.from("doc_fichas").upsert({
    documento_id: id, user_id: userId, partes: ficha.partes, referencia: ultimos4(ficha.referencia), inicio: ficha.inicio ?? null, vencimiento: ficha.vencimiento ?? null,
    importes: ficha.importes, condiciones: ficha.condiciones, contacto: ficha.contacto ?? null, origen: "claude", actualizado_en: new Date().toISOString(),
  });
  return f.error ? "no se pudo guardar la ficha" : null;
}
