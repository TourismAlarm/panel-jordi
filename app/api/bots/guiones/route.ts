import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, firmante, leerCuerpo, leerFiltro } from "@/lib/bots/entrada";
import { FiltroGuion, GuionIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";

const noVale = (error: string, status = 409) => NextResponse.json({ error }, { status });

// POST /api/bots/guiones — una propuesta de guion, siempre desde una idea que a Jordi le ha gustado.
// Con reemplaza_id es la nueva versión de un guion al que Jordi pidió cambios.
export async function POST(request: Request) {
  return conBot(request, "guiones:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, GuionIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...guion } = cuerpo.datos;
    const firma = firmante(clave, bot ?? "guionista", "guiones:escribir");
    if ("fallo" in firma) return firma.fallo;
    const { idea_id: _i, reemplaza_id: _r, ...textos } = guion; // los ids no son datos de nadie
    const conDatos = conDatosDeCliente(textos);
    if (conDatos) return conDatos;

    const db = supabaseAdmin();
    const { data: idea, error: eIdea } = await db.from("ideas").select("estado").eq("id", guion.idea_id).maybeSingle();
    if (eIdea) throw new Error(eIdea.message);
    if (!idea) return noVale("esa idea no existe", 404);
    if (idea.estado !== "me_gusta" && idea.estado !== "usada") return noVale("a Jordi aún no le ha gustado esa idea");

    let version = 1;
    if (guion.reemplaza_id) {
      const { data: previo, error } = await db.from("guiones_propuestos").select("estado, version").eq("id", guion.reemplaza_id).maybeSingle();
      if (error) throw new Error(error.message);
      if (!previo) return noVale("el guion que reemplaza no existe", 404);
      if (previo.estado !== "cambios") return noVale("solo se reemplaza un guion al que Jordi ha pedido cambios");
      version = previo.version + 1;
    }

    const { data, error } = await db.from("guiones_propuestos").insert({ ...guion, planos: guion.planos as Json, version, fuente_bot: firma.autor }).select("id").single();
    if (error) throw new Error(error.message);

    // Hecha la propuesta: la idea queda usada y la versión anterior, fuera de la vista.
    const ahora = new Date().toISOString();
    const { error: eUsada } = await db.from("ideas").update({ estado: "usada", actualizado: ahora }).eq("id", guion.idea_id);
    if (eUsada) throw new Error(eUsada.message);
    if (guion.reemplaza_id) {
      const { error: eVieja } = await db.from("guiones_propuestos").update({ estado: "sustituido", actualizado: ahora }).eq("id", guion.reemplaza_id);
      if (eVieja) throw new Error(eVieja.message);
    }
    return NextResponse.json({ ok: true, id: data.id, version }, { status: 201 });
  });
}

// GET /api/bots/guiones?estado=cambios — con «cambios» trae qué pidió Jordi (nota_jordi).
export async function GET(request: Request) {
  return conBot(request, "guiones:leer", async () => {
    const filtro = leerFiltro(request, "estado", FiltroGuion);
    if ("fallo" in filtro) return filtro.fallo;

    let consulta = supabaseAdmin().from("guiones_propuestos").select("*").order("creado", { ascending: false }).limit(100);
    if (filtro.valor) consulta = consulta.eq("estado", filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
