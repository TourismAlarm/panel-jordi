import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { reunirHoy } from "@/lib/hoy/reunir";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

// GET /api/hoy/senales — lo lee la tarea programada de Claude cada mañana con «Authorization: Bearer <HOY_RESUMEN_SECRET>».
// Devuelve las señales de hoy ya ordenadas por urgencia (sin enlaces internos ni IDs).
export async function GET(request: Request) {
  const denegado = bearerNoAutorizado(request, "HOY_RESUMEN_SECRET");
  if (denegado) return denegado;
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin.from("permitidos").select("user_id").limit(1).single();
    if (error) throw new Error(error.message);
    const f = await reunirHoy(admin, data.user_id);
    return NextResponse.json({
      fecha: f.fecha,
      fallos: f.fallos,
      senales: f.senales.map(({ modulo, nivel, titulo, detalle }) => ({ modulo, nivel, titulo, detalle })),
      salud: f.salud.slice(0, 4),
      agenda: f.eventos.map((e) => ({ titulo: e.titulo, inicio: e.inicio, todoElDia: e.todoElDia, lugar: e.lugar })),
      correos_sin_leer: f.correos.map((c) => ({ de: c.de, asunto: c.asunto, extracto: c.resumen })),
      google: f.google,
    });
  } catch (e) {
    console.error("api/hoy/senales:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "no se pudieron reunir las señales" }, { status: 500 });
  }
}
