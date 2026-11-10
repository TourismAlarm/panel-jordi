import { NextResponse } from "next/server";
import { z } from "zod";
import { conBot, firmante, firmanteDeUrl, leerCuerpo } from "@/lib/bots/entrada";
import { IdBot } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { enlaceValido } from "@/lib/hoy/prioridades";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// fin_* aún no está en los tipos generados.
const db = () => supabaseAdmin() as unknown as SupabaseClient;
type Fila = { clave: string; nivel: string; titulo: string; detalle: string; enlace: string | null; estado: string; actualizado: string };

// GET /api/bots/finanzas/consejos — lo que le has dicho a Jordi y sigue en pie, con su `estado`: `activo` (aún no lo ha leído) o `visto`.
export async function GET(request: Request) {
  return conBot(request, "finanzas:aconsejar", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:aconsejar");
    if ("fallo" in firma) return firma.fallo;
    const { data, error } = await db().from("fin_consejos").select("clave, nivel, titulo, detalle, enlace, estado, actualizado").eq("user_id", await duenoId()).neq("estado", "retirado").order("actualizado", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data });
  });
}

const clave = z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{0,79}$/, "minúsculas, números, - y _ (p. ej. suscripciones-duplicadas)");
const ConsejosIn = z
  .object({
    bot: IdBot.optional(),
    items: z
      .array(
        z.object({
          clave,
          nivel: z.enum(["problema", "ojo", "consejo", "bien"]),
          titulo: z.string().trim().min(1).max(120),
          detalle: z.string().trim().min(1).max(1000),
          enlace: z.string().max(1000).refine(enlaceValido, "una ruta del panel o una web https").optional(),
        }),
      )
      .max(30)
      .default([])
      .refine((l) => new Set(l.map((i) => i.clave)).size === l.length, { message: "clave repetida en la lista" }),
    retirar: z.array(clave).max(100).default([]),
  })
  .refine((c) => c.items.length + c.retirar.length > 0, { message: "sin items ni retirar no hay nada que hacer" });

// POST /api/bots/finanzas/consejos — dices a Jordi lo que le diría un buen asesor, o retiras lo que ya no es cierto.
// La misma `clave` actualiza. Si Jordi ya lo vio y no cambia nada, no vuelve a salir: solo reaparece si cambias el texto o el nivel.
export async function POST(request: Request) {
  return conBot(request, "finanzas:aconsejar", async (llave) => {
    const cuerpo = await leerCuerpo(request, ConsejosIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const firma = firmante(llave, cuerpo.datos.bot, "finanzas:aconsejar");
    if ("fallo" in firma) return firma.fallo;
    const userId = await duenoId();
    const ahora = new Date().toISOString();
    const { items, retirar } = cuerpo.datos;

    const previos = new Map<string, Fila>();
    if (items.length) {
      const { data, error } = await db().from("fin_consejos").select("clave, nivel, titulo, detalle, enlace, estado, actualizado").eq("user_id", userId).in("clave", items.map((i) => i.clave));
      if (error) throw new Error(error.message);
      for (const f of (data ?? []) as Fila[]) previos.set(f.clave, f);
    }
    // Igual que lo que ya vio: se deja como está. Nuevo o cambiado: sale (otra vez) como activo.
    const iguales = items.filter((i) => {
      const p = previos.get(i.clave);
      return p && p.estado !== "retirado" && p.nivel === i.nivel && p.titulo === i.titulo && p.detalle === i.detalle && (p.enlace ?? null) === (i.enlace ?? null);
    });
    const guardar = items
      .filter((i) => !iguales.includes(i))
      .map((i) => ({ user_id: userId, clave: i.clave, nivel: i.nivel, titulo: i.titulo, detalle: i.detalle, enlace: i.enlace ?? null, bot: firma.autor === "antonio" ? "antonio" : "finanzas", estado: "activo", actualizado: ahora }));
    if (guardar.length) {
      const { error } = await db().from("fin_consejos").upsert(guardar, { onConflict: "user_id,clave" });
      if (error) throw new Error(error.message);
    }
    let retirados = 0;
    if (retirar.length) {
      const { data, error } = await db().from("fin_consejos").update({ estado: "retirado", actualizado: ahora }).eq("user_id", userId).in("clave", retirar).neq("estado", "retirado").select("clave");
      if (error) throw new Error(error.message);
      retirados = data?.length ?? 0;
    }
    return NextResponse.json({ ok: true, guardados: guardar.length, sin_cambios: iguales.map((i) => i.clave), retirados }, { status: guardar.length ? 201 : 200 });
  });
}
