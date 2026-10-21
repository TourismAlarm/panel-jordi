import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { aISODia } from "@/lib/fechas";
import { CuerpoResumen } from "@/lib/hoy/resumen";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/hoy/resumen — la tarea programada de Claude deja aquí el resumen del día (con el mismo secreto).
// Repetirlo el mismo día sustituye el anterior.
export async function POST(request: Request) {
  const denegado = bearerNoAutorizado(request, "HOY_RESUMEN_SECRET");
  if (denegado) return denegado;

  const texto = await request.text();
  if (texto.length > 50_000) return NextResponse.json({ error: "demasiado grande" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(texto);
  } catch {
    return NextResponse.json({ error: "JSON no válido" }, { status: 400 });
  }
  const cuerpo = CuerpoResumen.safeParse(json);
  if (!cuerpo.success) return NextResponse.json({ error: "datos no válidos", detalle: cuerpo.error.issues.slice(0, 8).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: dueno, error: e1 } = await admin.from("permitidos").select("user_id").limit(1).single();
  if (e1) return NextResponse.json({ error: "no hay usuario" }, { status: 500 });

  const { resumen, prioridades, agenda, correos } = cuerpo.data;
  const { error } = await admin.from("resumenes_diarios").upsert(
    { user_id: dueno.user_id, fecha: aISODia(), resumen, prioridades, senales: { agenda, correos }, generado_en: new Date().toISOString() },
    { onConflict: "user_id,fecha" },
  );
  if (error) {
    console.error("api/hoy/resumen:", error.message);
    return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, fecha: aISODia() });
}
