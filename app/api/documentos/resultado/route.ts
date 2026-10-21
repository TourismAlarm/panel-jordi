import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { CuerpoResultado, ultimos4 } from "@/lib/documentos/contrato";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/documentos/resultado — la tarea de Claude deja categoría, tipo, texto por página y ficha de un documento.
// Todo lo que no aparece en el documento llega como «no especificado» (se guarda sin dato). Auth: Bearer DOCS_TAREA_SECRET.
export async function POST(request: Request) {
  const denegado = bearerNoAutorizado(request, "DOCS_TAREA_SECRET");
  if (denegado) return denegado;
  const texto = await request.text();
  if (texto.length > 2_000_000) return NextResponse.json({ error: "demasiado grande" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }
  const c = CuerpoResultado.safeParse(json);
  if (!c.success) return NextResponse.json({ error: "datos no válidos", detalle: c.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  const { id, categoria, tipo, paginas, ficha } = c.data;

  const admin = supabaseAdmin();
  const { data: doc } = await admin.from("doc_documentos").select("id, user_id").eq("id", id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "documento no encontrado" }, { status: 404 });

  const a = await admin.from("doc_documentos").update({ categoria, tipo: tipo ?? null, estado: "procesado", error: null, procesado_en: new Date().toISOString() }).eq("id", id);
  if (a.error) return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });

  if (paginas.length) {
    const p = await admin.from("doc_paginas").upsert(paginas.map((x) => ({ documento_id: id, user_id: doc.user_id, pagina: x.pagina, texto: x.texto })), { onConflict: "documento_id,pagina" });
    if (p.error) return NextResponse.json({ error: "no se pudo guardar el texto" }, { status: 500 });
  }
  const f = await admin.from("doc_fichas").upsert({
    documento_id: id, user_id: doc.user_id, partes: ficha.partes, referencia: ultimos4(ficha.referencia), inicio: ficha.inicio ?? null, vencimiento: ficha.vencimiento ?? null,
    importes: ficha.importes, condiciones: ficha.condiciones, contacto: ficha.contacto ?? null, origen: "claude", actualizado_en: new Date().toISOString(),
  });
  if (f.error) return NextResponse.json({ error: "no se pudo guardar la ficha" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
