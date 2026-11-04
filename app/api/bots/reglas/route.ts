import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, leerCuerpo, leerFiltro } from "@/lib/bots/entrada";
import { FiltroAgente, ReglaIn } from "@/lib/bots/esquemas";
import { tacharDatos } from "@/lib/bots/limpieza";
import { supabaseAdmin } from "@/lib/supabase/admin";

const tachado = (t: string | null) => (t === null ? null : tacharDatos(t));

// GET /api/bots/reglas?agente=guionista&historial=1 — las reglas activas de Aprende y, si se pide, sus cambios.
export async function GET(request: Request) {
  return conBot(request, "reglas:leer", async () => {
    const filtro = leerFiltro(request, "agente", FiltroAgente);
    if ("fallo" in filtro) return filtro.fallo;

    const db = supabaseAdmin();
    let consulta = db.from("reglas").select("clave, agente, regla, medida, version, actualizada_por, actualizada_en").eq("estado", "activa").order("clave");
    if (filtro.valor) consulta = consulta.eq("agente", filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const items = data.map((r) => ({ ...r, regla: tacharDatos(r.regla) }));
    if (new URL(request.url).searchParams.get("historial") !== "1") return NextResponse.json({ items });

    let cambios = db.from("reglas_historial").select("clave, accion, texto_antes, texto_despues, estado_antes, estado_despues, quien, por_que, creado, reglas!inner(agente)").order("id", { ascending: false }).limit(500);
    if (filtro.valor) cambios = cambios.eq("reglas.agente", filtro.valor);
    const { data: filas, error: eCambios } = await cambios;
    if (eCambios) throw new Error(eCambios.message);
    const historial = filas.map(({ reglas, ...h }) => ({
      ...h,
      agente: reglas.agente,
      texto_antes: tachado(h.texto_antes),
      texto_despues: tachado(h.texto_despues),
      por_que: tachado(h.por_que),
    }));
    return NextResponse.json({ items, historial });
  });
}

// POST /api/bots/reglas — Antonio crea una regla: entra activa y Jordi la ve en Aprende, con «Deshacer».
export async function POST(request: Request) {
  return conBot(request, "reglas:escribir", async () => {
    const cuerpo = await leerCuerpo(request, ReglaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;

    const { agente, regla, evidencia, medida, por_que } = cuerpo.datos;
    const { data, error } = await supabaseAdmin().rpc("regla_crear", {
      p_agente: agente,
      p_regla: regla,
      p_evidencia: evidencia,
      p_medida: medida ?? "",
      p_por_que: por_que,
      p_quien: "antonio",
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, clave: data }, { status: 201 });
  });
}
