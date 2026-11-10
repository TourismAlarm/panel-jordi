import { NextResponse } from "next/server";
import { RutinasIn } from "@/lib/arnes/esquemas";
import { conBot, leerCuerpo } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/arnes/rutinas — Antonio dice cómo van sus rutinas de Grok Bot. Upsert por id: repetir no duplica.
export async function POST(request: Request) {
  return conBot(request, "arnes:escribir", async () => {
    const cuerpo = await leerCuerpo(request, RutinasIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const user_id = await duenoId();
    const actualizado = new Date().toISOString();

    const { error } = await supabaseAdmin()
      .from("arnes_rutinas")
      .upsert(cuerpo.datos.map((r) => ({ ...r, user_id, actualizado })), { onConflict: "id" });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, rutinas: cuerpo.datos.length });
  });
}
