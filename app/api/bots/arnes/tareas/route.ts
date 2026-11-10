import { NextResponse } from "next/server";
import { TareaIn } from "@/lib/arnes/esquemas";
import { ESTADOS_CERRADOS } from "@/lib/arnes/vista";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/arnes/tareas — Antonio apunta una tarea a medias o cómo va. Upsert por id: repetir no duplica.
// Lo que no viene no se toca (empezada_en nunca); «hecha» o «cancelada» la cierran y sale de la vista.
export async function POST(request: Request) {
  return conBot(request, "arnes:escribir", async () => {
    const cuerpo = await leerCuerpo(request, TareaIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const t = cuerpo.datos;
    const cerrada = (ESTADOS_CERRADOS as readonly string[]).includes(t.estado);

    const { error } = await supabaseAdmin()
      .from("arnes_tareas")
      .upsert({ ...t, user_id: await duenoId(), cerrada_en: cerrada ? new Date().toISOString() : null }, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, id: t.id, abierta: !cerrada });
  });
}
