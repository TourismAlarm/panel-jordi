import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, firmante, leerCuerpo, leerFiltro } from "@/lib/bots/entrada";
import { FiltroIdea, IdeaIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/ideas — una idea nueva, para que Jordi la marque en ELSA → Ideas.
export async function POST(request: Request) {
  return conBot(request, "ideas:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, IdeaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...idea } = cuerpo.datos;
    const firma = firmante(clave, bot ?? "ideas", "ideas:escribir");
    if ("fallo" in firma) return firma.fallo;
    const conDatos = conDatosDeCliente(idea);
    if (conDatos) return conDatos;

    const { data, error } = await supabaseAdmin().from("ideas").insert({ ...idea, fuente_bot: firma.autor }).select("id").single();
    if (error?.code === "23505") return NextResponse.json({ error: "ya hay una idea con ese título" }, { status: 409 });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  });
}

// GET /api/bots/ideas?estado=me_gusta — con «me_gusta» el Guionista ve las que puede usar, y la nota de Jordi.
export async function GET(request: Request) {
  return conBot(request, "ideas:leer", async () => {
    const filtro = leerFiltro(request, "estado", FiltroIdea);
    if ("fallo" in filtro) return filtro.fallo;

    let consulta = supabaseAdmin().from("ideas").select("*").order("creado", { ascending: false }).limit(200);
    if (filtro.valor) consulta = consulta.eq("estado", filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
