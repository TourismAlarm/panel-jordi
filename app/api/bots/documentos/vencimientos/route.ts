import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia, diasHasta, sumarDias } from "@/lib/fechas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/documentos/vencimientos?dias=60 — lo que vence en ese plazo o ya venció. Sin texto: es lo único de documentos que lee el bot Día.
export async function GET(request: Request) {
  return conBot(request, "documentos:vencimientos", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "documentos:vencimientos");
    if ("fallo" in firma) return firma.fallo;
    const dias = Number(new URL(request.url).searchParams.get("dias") ?? 60);
    if (!Number.isInteger(dias) || dias < 0 || dias > 400) return NextResponse.json({ error: "dias entre 0 y 400" }, { status: 400 });
    const db = supabaseAdmin();
    const userId = await duenoId();
    const hoy = aISODia();
    const { data, error } = await db.from("doc_fichas").select("documento_id, vencimiento").eq("user_id", userId).not("vencimiento", "is", null).lte("vencimiento", sumarDias(hoy, dias)).order("vencimiento").limit(500);
    if (error) throw new Error(error.message);
    if (!data.length) return NextResponse.json({ items: [] });
    const docs = await db.from("doc_documentos").select("id, nombre, categoria").eq("user_id", userId).in("id", data.map((f) => f.documento_id));
    if (docs.error) throw new Error(docs.error.message);
    const porId = new Map(docs.data.map((d) => [d.id, d]));
    return NextResponse.json({
      items: data.map((f) => ({
        id: f.documento_id,
        nombre: porId.get(f.documento_id)?.nombre ?? "Documento",
        categoria: porId.get(f.documento_id)?.categoria ?? null,
        vencimiento: f.vencimiento,
        dias_restantes: diasHasta(f.vencimiento as string, hoy),
      })),
    });
  });
}
