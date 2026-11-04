import { NextResponse } from "next/server";
import { conBot } from "@/lib/bots/entrada";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/edicion/tomar — el PC se lleva el encargo pendiente más antiguo (atómico) y ve qué falta por copiar a FINAL/.
export async function POST(request: Request) {
  return conBot(request, "edicion:tomar", async () => {
    const db = supabaseAdmin();
    const { data, error } = await db.rpc("tomar_encargo");
    if (error) throw new Error(error.message);
    const { data: finales, error: eFinales } = await db
      .from("encargos_edicion")
      .select("id, video_id, version, resultado_url")
      .eq("fase", "acabado")
      .eq("estado", "aprobado")
      .is("final_url", null)
      .order("creado");
    if (eFinales) throw new Error(eFinales.message);
    return NextResponse.json({ encargo: data[0] ?? null, finales });
  });
}
