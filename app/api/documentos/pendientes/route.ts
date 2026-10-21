import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/documentos/pendientes — la tarea de Claude pide los documentos subidos que aún no tienen ficha.
// Cada uno trae un enlace de descarga que caduca a los 15 minutos. Auth: Bearer DOCS_TAREA_SECRET.
export async function GET(request: Request) {
  const denegado = bearerNoAutorizado(request, "DOCS_TAREA_SECRET");
  if (denegado) return denegado;
  const admin = supabaseAdmin();
  const { data, error } = await admin.from("doc_documentos").select("id, nombre, mime, ruta").eq("estado", "pendiente").not("ruta", "is", null).order("subido_en").limit(10);
  if (error) return NextResponse.json({ error: "no se pudo leer" }, { status: 500 });
  const docs = await Promise.all(
    (data ?? []).map(async (d) => {
      const s = await admin.storage.from("documentos").createSignedUrl(d.ruta as string, 900);
      return { id: d.id, nombre: d.nombre, mime: d.mime, url: s.data?.signedUrl ?? null };
    }),
  );
  return NextResponse.json({ documentos: docs.filter((d) => d.url) });
}
