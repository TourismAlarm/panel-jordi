import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/finanzas/cuentas — saldos y estado del enlace con el banco. Sin sesión ni IBAN.
export async function GET(request: Request) {
  return conBot(request, "finanzas:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:leer");
    if ("fallo" in firma) return firma.fallo;
    const db = supabaseAdmin();
    const userId = await duenoId();
    const [cuentas, enlaces] = await Promise.all([
      db.from("fin_accounts").select("id, name, type, role, balance, currency").eq("user_id", userId).eq("is_active", true).order("name"),
      db.from("fin_bank_links").select("account_id, aspsp_name, status, valid_until, last_synced_at").eq("user_id", userId),
    ]);
    if (cuentas.error) throw new Error(cuentas.error.message);
    if (enlaces.error) throw new Error(enlaces.error.message);
    const items = cuentas.data.map((c) => {
      const e = enlaces.data.find((x) => x.account_id === c.id);
      return {
        id: c.id,
        nombre: c.name,
        tipo: c.type,
        rol: c.role,
        saldo: Number(c.balance),
        moneda: c.currency,
        banco: e?.aspsp_name ?? null,
        estado_enlace: e?.status ?? null,
        valido_hasta: e?.valid_until ?? null,
        ultima_sync: e?.last_synced_at ?? null,
      };
    });
    return NextResponse.json({ items });
  });
}
