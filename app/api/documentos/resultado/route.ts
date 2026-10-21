import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { CuerpoResultado } from "@/lib/documentos/contrato";
import { guardarResultado } from "@/lib/documentos/guardar";
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
  const { id } = c.data;

  const admin = supabaseAdmin();
  const { data: doc } = await admin.from("doc_documentos").select("id, user_id").eq("id", id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "documento no encontrado" }, { status: 404 });

  const fallo = await guardarResultado(admin, doc.user_id, c.data);
  if (fallo) return NextResponse.json({ error: fallo }, { status: 500 });
  return NextResponse.json({ ok: true });
}
