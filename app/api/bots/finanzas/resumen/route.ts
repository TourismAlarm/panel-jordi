import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl, leerFiltro } from "@/lib/bots/entrada";
import { FiltroMes } from "@/lib/bots/esquemas";
import { cobrosDeducidos, gastoPorCategoria, ocultarIban } from "@/lib/bots/vida";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia, sumarDias } from "@/lib/fechas";
import { resumenInicio } from "@/lib/finanzas/resumen-inicio";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/finanzas/resumen?mes=YYYY-MM — el mes financiero (va de cobro a cobro). Es lo único de dinero que lee el bot Día.
export async function GET(request: Request) {
  return conBot(request, "finanzas:resumen", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:resumen");
    if ("fallo" in firma) return firma.fallo;
    const mes = leerFiltro(request, "mes", FiltroMes);
    if ("fallo" in mes) return mes.fallo;
    const db = supabaseAdmin();
    const userId = await duenoId();
    const r = await resumenInicio(userId, mes.valor, { soloLectura: true });
    const hoy = aISODia();

    const [movimientos, categorias, ingresos, reglas] = await Promise.all([
      db.from("fin_transactions").select("id, date, type, amount, kind, counterparty, description, account_id, category_id").eq("user_id", userId).gte("date", r.period.start).lte("date", r.period.end).limit(5000),
      db.from("fin_categories").select("id, name").eq("user_id", userId),
      db.from("fin_transactions").select("date, amount, counterparty, kind").eq("user_id", userId).eq("type", "income").is("refund_of", null).gte("date", sumarDias(hoy, -120)).limit(1000),
      db.from("fin_recurring_rules").select("description, amount, frequency, next_occurrence").eq("user_id", userId).eq("type", "income").eq("is_active", true),
    ]);
    if (movimientos.error) throw new Error(movimientos.error.message);
    if (categorias.error) throw new Error(categorias.error.message);
    if (ingresos.error) throw new Error(ingresos.error.message);
    if (reglas.error) throw new Error(reglas.error.message);
    const nombre = new Map(categorias.data.map((c) => [c.id, c.name]));

    return NextResponse.json({
      mes: r.month,
      periodo: r.period,
      queda: r.remaining,
      por_dia: r.perDay,
      proximo_cobro: r.payday,
      ingresos: r.flow.income,
      gastado: r.flow.spent,
      gasto: gastoPorCategoria(
        movimientos.data.map((t) => ({
          id: t.id,
          date: t.date,
          type: t.type as "income" | "expense",
          amount: Number(t.amount),
          kind: t.kind,
          account_id: t.account_id,
          importe: Number(t.amount),
          categoria: t.category_id ? (nombre.get(t.category_id) ?? null) : null,
          contraparte: ocultarIban(t.counterparty ?? t.description),
        })),
      ),
      cobros_previstos: reglas.data.map((x) => ({ descripcion: x.description, importe: Number(x.amount), frecuencia: x.frequency, proximo: x.next_occurrence })),
      cobros_deducidos: cobrosDeducidos(
        ingresos.data.filter((t) => (t.kind ?? "regular") === "regular").map((t) => ({ fecha: t.date, importe: Number(t.amount), contraparte: ocultarIban(t.counterparty) })),
        hoy,
      ),
    });
  });
}
