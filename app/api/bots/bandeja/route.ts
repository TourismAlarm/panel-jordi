import { NextResponse } from "next/server";
import { moduloDeBot } from "@/lib/bots/catalogo";
import { conBot, firmante, firmanteDeUrl, leerCuerpo } from "@/lib/bots/entrada";
import { BandejaIn, FiltroBandeja } from "@/lib/bots/esquemas";
import { dejarEnBandeja } from "@/lib/datos/bandeja";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/bandeja — un bot deja un aviso, pregunta o borrador, en el módulo de ese bot.
export async function POST(request: Request) {
  return conBot(request, "bandeja:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, BandejaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...datos } = cuerpo.datos;
    const firma = firmante(clave, bot, "bandeja:escribir");
    if ("fallo" in firma) return firma.fallo;
    const id = await dejarEnBandeja({ modulo: moduloDeBot(firma.autor), ...datos, origen_bot: firma.autor });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  });
}

// GET /api/bots/bandeja?estado=respondido&bot=ideas — lo que dejó ese bot, con la respuesta de Jordi.
// Nunca ve lo de otros módulos.
export async function GET(request: Request) {
  return conBot(request, "bandeja:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "bandeja:leer");
    if ("fallo" in firma) return firma.fallo;
    const estado = new URL(request.url).searchParams.get("estado");
    const filtro = estado === null ? null : FiltroBandeja.safeParse(estado);
    if (filtro && !filtro.success) return NextResponse.json({ error: "estado no válido" }, { status: 400 });

    let consulta = supabaseAdmin()
      .from("bandeja")
      .select("id, tipo, titulo, cuerpo, estado, respuesta, created_at")
      .eq("modulo", moduloDeBot(firma.autor))
      .eq("origen_bot", firma.autor)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filtro) consulta = consulta.eq("estado", filtro.data);

    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
