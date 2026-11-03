import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { BandejaIn, FiltroBandeja } from "@/lib/bots/esquemas";
import { dejarEnBandeja } from "@/lib/datos/bandeja";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/bandeja — un bot deja un aviso, pregunta o borrador. Siempre en el módulo ELSA.
export async function POST(request: Request) {
  return conBot(request, "bandeja:escribir", async (bot) => {
    const cuerpo = await leerCuerpo(request, BandejaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const id = await dejarEnBandeja({ modulo: "elsa", ...cuerpo.datos, origen_bot: bot });
    return NextResponse.json({ ok: true, id }, { status: 201 });
  });
}

// GET /api/bots/bandeja?estado=respondido — lo que dejó ESTE bot, con la respuesta de Jordi.
// Nunca ve lo de otros módulos (finanzas, salud…) ni lo de otros bots.
export async function GET(request: Request) {
  return conBot(request, "bandeja:leer", async (bot) => {
    const estado = new URL(request.url).searchParams.get("estado");
    const filtro = estado === null ? null : FiltroBandeja.safeParse(estado);
    if (filtro && !filtro.success) return NextResponse.json({ error: "estado no válido" }, { status: 400 });

    let consulta = supabaseAdmin()
      .from("bandeja")
      .select("id, tipo, titulo, cuerpo, estado, respuesta, created_at")
      .eq("modulo", "elsa")
      .eq("origen_bot", bot)
      .order("created_at", { ascending: false })
      .limit(100);
    if (filtro) consulta = consulta.eq("estado", filtro.data);

    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
