import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { ReelsRedesIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/redes/reels — qué es cada reel (GE, tema, gancho, duración, apuesta que prueba). Cada uno entero:
// lo que no mandes queda vacío. Sin datos de clientes.
export async function POST(request: Request) {
  return conBot(request, "redes:escribir", async () => {
    const cuerpo = await leerCuerpo(request, ReelsRedesIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;

    const ahora = new Date().toISOString();
    const filas = cuerpo.datos.items.map((r) => ({
      permalink: r.permalink,
      ge: r.ge ?? null,
      tema: r.tema ?? null,
      gancho: r.gancho ?? null,
      tipo_gancho: r.tipo_gancho ?? null,
      prueba: r.prueba ?? null,
      duracion_s: r.duracion_s ?? null,
      elsa: r.elsa,
      actualizado_en: ahora,
    }));
    const { error } = await supabaseAdmin().from("redes_reels").upsert(filas, { onConflict: "permalink" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, reels: filas.length }, { status: 201 });
  });
}

// GET /api/bots/redes/reels — las fichas que ya hay.
export async function GET(request: Request) {
  return conBot(request, "redes:leer", async () => {
    const { data, error } = await supabaseAdmin().from("redes_reels").select("permalink, ge, tema, gancho, tipo_gancho, prueba, duracion_s, elsa, actualizado_en").order("actualizado_en", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}
