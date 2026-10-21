import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { CuerpoIngesta } from "@/lib/salud/ingesta";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const maxDuration = 60;

// POST /api/salud/ingesta — el proceso del PC deja aquí los datos de salud (reloj, pesas…).
// Protegida con SALUD_INGESTA_SECRET. Repetir el envío no duplica: se sobrescribe por día+métrica+fuente.
export async function POST(request: Request) {
  const denegado = bearerNoAutorizado(request, "SALUD_INGESTA_SECRET");
  if (denegado) return denegado;

  const parsed = CuerpoIngesta.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos no válidos", detalle: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  const { metricas, entrenos } = parsed.data;

  const db = supabaseAdmin();
  const { data: dueno, error: eDueno } = await db.from("permitidos").select("user_id").limit(1).single();
  if (eDueno) return NextResponse.json({ error: "no hay usuario permitido" }, { status: 500 });
  const user_id = dueno.user_id;
  const ahora = new Date().toISOString();

  // Si el mismo día+métrica llega dos veces en el mismo envío, gana la última.
  const unicas = new Map<string, (typeof metricas)[number]>();
  for (const m of metricas) unicas.set(`${m.fecha}|${m.metrica}|${m.fuente}`, m);
  const filasMetricas = [...unicas.values()].map((m) => ({ user_id, fecha: m.fecha, metrica: m.metrica, valor: m.valor, unidad: m.unidad ?? null, fuente: m.fuente, actualizado_en: ahora }));
  for (let i = 0; i < filasMetricas.length; i += 500) {
    const { error } = await db.from("sal_metricas").upsert(filasMetricas.slice(i, i + 500), { onConflict: "user_id,fecha,metrica,fuente" });
    if (error) return NextResponse.json({ error: `métricas: ${error.message}` }, { status: 500 });
  }

  // Entrenos: se actualiza el que ya existe (misma fuente + id_externo) y se crea el nuevo.
  let nuevos = 0;
  let actualizados = 0;
  for (const e of entrenos) {
    const fila = { user_id, fecha: e.fecha, tipo: e.tipo, duracion_min: e.duracion_min ?? null, distancia_km: e.distancia_km ?? null, calorias: e.calorias ?? null, fc_media: e.fc_media ?? null, fuente: e.fuente, id_externo: e.id_externo, actualizado_en: ahora };
    const { data: previo } = await db.from("sal_entrenos").select("id").eq("user_id", user_id).eq("fuente", e.fuente).eq("id_externo", e.id_externo).maybeSingle();
    const { error } = previo ? await db.from("sal_entrenos").update(fila).eq("id", previo.id) : await db.from("sal_entrenos").insert(fila);
    if (error) return NextResponse.json({ error: `entrenos: ${error.message}` }, { status: 500 });
    if (previo) actualizados++;
    else nuevos++;
  }

  return NextResponse.json({ ok: true, metricas: filasMetricas.length, entrenos: { nuevos, actualizados } });
}
