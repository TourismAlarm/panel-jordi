import { NextResponse } from "next/server";
import { conBot, leerFiltro } from "@/lib/bots/entrada";
import { FiltroAgente } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/reglas?agente=guionista — las reglas activas de Aprende. Las que Jordi ha quitado ya no salen,
// aunque el PC aún no las haya retirado.
export async function GET(request: Request) {
  return conBot(request, "reglas:leer", async () => {
    const filtro = leerFiltro(request, "agente", FiltroAgente);
    if ("fallo" in filtro) return filtro.fallo;

    let consulta = supabaseAdmin().from("reglas").select("clave, agente, regla, medida").eq("estado", "activa").or("decision.is.null,decision.neq.quitar").order("clave");
    if (filtro.valor) consulta = consulta.eq("agente", filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
