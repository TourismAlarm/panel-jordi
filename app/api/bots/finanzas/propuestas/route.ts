import { NextResponse } from "next/server";
import { z } from "zod";
import { conBot, firmante, firmanteDeUrl, leerCuerpo } from "@/lib/bots/entrada";
import { IdBot } from "@/lib/bots/esquemas";
import { ocultarIban } from "@/lib/bots/vida";
import { duenoId } from "@/lib/datos/dueno";
import { motivoDeRechazo } from "@/lib/finanzas/propuestas-puro";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

// fin_* aún no está en los tipos generados.
const db = () => supabaseAdmin() as unknown as SupabaseClient;
const MAX_PENDIENTES = 300;

type Tx = { id: string; date: string; type: string; amount: number | string; description: string | null; counterparty: string | null; category_id: string | null; kind: string | null; account_id: string | null };
type Previa = { transaction_id: string; category_id: string; estado: string };

// GET /api/bots/finanzas/propuestas — lo que hay por categorizar: los movimientos sin categoría (con tu propuesta
// anterior, si la hay, y si Jordi la rechazó) y las categorías entre las que puedes elegir.
export async function GET(request: Request) {
  return conBot(request, "finanzas:proponer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:proponer");
    if ("fallo" in firma) return firma.fallo;
    const userId = await duenoId();
    const [txs, cats, cuentas, previas] = await Promise.all([
      db().from("fin_transactions").select("id, date, type, amount, description, counterparty, category_id, kind, account_id").eq("user_id", userId).is("category_id", null).eq("kind", "regular").order("date", { ascending: false }).limit(MAX_PENDIENTES),
      db().from("fin_categories").select("id, name, type").eq("user_id", userId).order("name"),
      db().from("fin_accounts").select("id, name").eq("user_id", userId),
      db().from("fin_propuestas_categoria").select("transaction_id, category_id, estado").eq("user_id", userId).neq("estado", "aceptada"),
    ]);
    for (const x of [txs, cats, cuentas, previas]) if (x.error) throw new Error(x.error.message);
    const categorias = (cats.data ?? []) as { id: string; name: string; type: string }[];
    const nombreCategoria = new Map(categorias.map((c) => [c.id, c.name]));
    const nombreCuenta = new Map(((cuentas.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c.name]));
    const previa = new Map(((previas.data ?? []) as Previa[]).map((p) => [p.transaction_id, p]));
    return NextResponse.json({
      categorias: categorias.map((c) => ({ id: c.id, nombre: c.name, tipo: c.type })),
      movimientos: ((txs.data ?? []) as Tx[]).map((t) => {
        const p = previa.get(t.id);
        return {
          id: t.id,
          fecha: t.date,
          tipo: t.type,
          importe: Number(t.amount),
          descripcion: ocultarIban(t.description),
          counterparty: ocultarIban(t.counterparty),
          cuenta: t.account_id ? (nombreCuenta.get(t.account_id) ?? null) : null,
          propuesta: p ? { categoria: nombreCategoria.get(p.category_id) ?? null, estado: p.estado } : null,
        };
      }),
    });
  });
}

const PropuestasIn = z.object({
  bot: IdBot.optional(),
  items: z
    .array(z.object({ movimiento_id: z.uuid(), categoria: z.string().trim().min(1).max(120), motivo: z.string().trim().min(1).max(300).optional() }))
    .min(1)
    .max(200)
    .refine((l) => new Set(l.map((i) => i.movimiento_id)).size === l.length, { message: "movimiento repetido en la lista" }),
});

// POST /api/bots/finanzas/propuestas — propones categoría para movimientos sin categoría. No cambia ningún movimiento:
// Jordi lo ve en Finanzas y acepta o rechaza. Volver a proponer para el mismo movimiento sustituye tu propuesta anterior.
export async function POST(request: Request) {
  return conBot(request, "finanzas:proponer", async (clave) => {
    const cuerpo = await leerCuerpo(request, PropuestasIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const firma = firmante(clave, cuerpo.datos.bot, "finanzas:proponer");
    if ("fallo" in firma) return firma.fallo;
    const userId = await duenoId();
    const ids = cuerpo.datos.items.map((i) => i.movimiento_id);

    const [txs, cats, previas] = await Promise.all([
      db().from("fin_transactions").select("id, type, kind, category_id").eq("user_id", userId).in("id", ids),
      db().from("fin_categories").select("id, name, type").eq("user_id", userId),
      db().from("fin_propuestas_categoria").select("transaction_id, category_id, estado").eq("user_id", userId).in("transaction_id", ids),
    ]);
    for (const x of [txs, cats, previas]) if (x.error) throw new Error(x.error.message);
    const tx = new Map(((txs.data ?? []) as { id: string; type: string; kind: string | null; category_id: string | null }[]).map((t) => [t.id, t]));
    const categorias = (cats.data ?? []) as { id: string; name: string; type: string }[];
    const previa = new Map(((previas.data ?? []) as Previa[]).map((p) => [p.transaction_id, p]));

    const guardar: Record<string, unknown>[] = [];
    const no_guardadas: { movimiento_id: string; por_que: string }[] = [];
    for (const i of cuerpo.datos.items) {
      const t = tx.get(i.movimiento_id);
      // Por id, o por nombre dentro del tipo del movimiento («Comida» de gasto, no la de ingreso).
      const cat = categorias.find((c) => c.id === i.categoria) ?? categorias.find((c) => c.name.toLowerCase() === i.categoria.toLowerCase() && (!t || c.type === t.type)) ?? categorias.find((c) => c.name.toLowerCase() === i.categoria.toLowerCase());
      const por_que = motivoDeRechazo(t, cat, previa.get(i.movimiento_id));
      if (por_que) {
        no_guardadas.push({ movimiento_id: i.movimiento_id, por_que });
        continue;
      }
      guardar.push({ user_id: userId, transaction_id: i.movimiento_id, category_id: cat!.id, motivo: i.motivo ?? null, bot: firma.autor === "antonio" ? "antonio" : "finanzas", estado: "propuesta", creada: new Date().toISOString(), decidida_en: null });
    }
    if (guardar.length) {
      const { error } = await db().from("fin_propuestas_categoria").upsert(guardar, { onConflict: "transaction_id" });
      if (error) throw new Error(error.message);
    }
    return NextResponse.json({ ok: true, guardadas: guardar.length, no_guardadas }, { status: guardar.length ? 201 : 200 });
  });
}
