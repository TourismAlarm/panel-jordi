import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { CuerpoFallo } from "@/lib/documentos/contrato";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/documentos/fallo — la tarea no pudo leer un documento: queda marcado con el motivo (y se ve en la app).
export async function POST(request: Request) {
  const denegado = bearerNoAutorizado(request, "DOCS_TAREA_SECRET");
  if (denegado) return denegado;
  const c = CuerpoFallo.safeParse(await request.json().catch(() => null));
  if (!c.success) return NextResponse.json({ error: "datos no válidos" }, { status: 400 });
  const { error } = await supabaseAdmin().from("doc_documentos").update({ estado: "error", error: c.data.error, procesado_en: new Date().toISOString() }).eq("id", c.data.id);
  if (error) return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
