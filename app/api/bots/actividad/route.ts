import { NextResponse } from "next/server";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { ActividadIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/actividad — un bot registra una ejecución suya (sale en ELSA → Actividad → Bots).
export async function POST(request: Request) {
  return conBot(request, "actividad:escribir", async (bot) => {
    const cuerpo = await leerCuerpo(request, ActividadIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { tarea, inicio, fin, resultado, nota, enlace } = cuerpo.datos;

    const { data, error } = await supabaseAdmin()
      .from("actividad_bots")
      .insert({ bot, tarea, inicio, fin: fin ?? null, resultado, nota: nota ?? null, enlace: enlace ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  });
}
