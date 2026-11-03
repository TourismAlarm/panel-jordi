import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, firmante, leerCuerpo, leerFiltro } from "@/lib/bots/entrada";
import { FiltroMemoria, MemoriaIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/memoria — guarda lo que todos deben saber. La misma clave actualiza, no duplica.
export async function POST(request: Request) {
  return conBot(request, "memoria:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, MemoriaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...memoria } = cuerpo.datos;
    const firma = firmante(clave, bot, "memoria:escribir");
    if ("fallo" in firma) return firma.fallo;
    const conDatos = conDatosDeCliente({ contenido: memoria.contenido });
    if (conDatos) return conDatos;

    const { data, error } = await supabaseAdmin()
      .from("memoria_comun")
      .upsert({ ...memoria, autor: firma.autor, actualizado: new Date().toISOString() }, { onConflict: "clave" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: data.id });
  });
}

// GET /api/bots/memoria?tipo=decision
export async function GET(request: Request) {
  return conBot(request, "memoria:leer", async () => {
    const filtro = leerFiltro(request, "tipo", FiltroMemoria);
    if ("fallo" in filtro) return filtro.fallo;

    let consulta = supabaseAdmin().from("memoria_comun").select("clave, contenido, tipo, autor, actualizado").order("actualizado", { ascending: false }).limit(500);
    if (filtro.valor) consulta = consulta.eq("tipo", filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
