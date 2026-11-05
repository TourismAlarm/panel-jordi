import { NextResponse } from "next/server";
import { leerPagina, pagina } from "@/lib/bots/consultas";
import { conBot, firmanteDeUrl, leerFiltro } from "@/lib/bots/entrada";
import { FechaIso, FiltroCategoriaDocumento, FiltroEstadoDocumento } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/documentos?estado=&categoria=&desde=&limite=&cursor= — la lista, sin texto.
export async function GET(request: Request) {
  return conBot(request, "documentos:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "documentos:leer");
    if ("fallo" in firma) return firma.fallo;
    const estado = leerFiltro(request, "estado", FiltroEstadoDocumento);
    if ("fallo" in estado) return estado.fallo;
    const categoria = leerFiltro(request, "categoria", FiltroCategoriaDocumento);
    if ("fallo" in categoria) return categoria.fallo;
    const desde = leerFiltro(request, "desde", FechaIso);
    if ("fallo" in desde) return desde.fallo;
    const pag = leerPagina(request);
    if ("fallo" in pag) return pag.fallo;
    const db = supabaseAdmin();
    const userId = await duenoId();

    let consulta = db.from("doc_documentos").select("id, nombre, categoria, tipo, mime, estado, subido_en").eq("user_id", userId).order("subido_en", { ascending: false }).order("id").range(pag.inicio, pag.inicio + pag.limite);
    if (estado.valor) consulta = consulta.eq("estado", estado.valor);
    if (categoria.valor) consulta = consulta.eq("categoria", categoria.valor);
    if (desde.valor) consulta = consulta.gte("subido_en", desde.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const fichas = await db.from("doc_fichas").select("documento_id, vencimiento").eq("user_id", userId).in("documento_id", data.map((d) => d.id));
    if (fichas.error) throw new Error(fichas.error.message);
    const vencimiento = new Map(fichas.data.map((f) => [f.documento_id, f.vencimiento]));
    return NextResponse.json(pagina(data.map((d) => ({ ...d, vencimiento: vencimiento.get(d.id) ?? null })), pag));
  });
}
