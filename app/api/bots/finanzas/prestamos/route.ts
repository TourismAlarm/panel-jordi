import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { proximaCuota } from "@/lib/bots/vida";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia } from "@/lib/fechas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/finanzas/prestamos — los activos, con sus pagos y la próxima cuota calculada.
export async function GET(request: Request) {
  return conBot(request, "finanzas:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "finanzas:leer");
    if ("fallo" in firma) return firma.fallo;
    const db = supabaseAdmin();
    const userId = await duenoId();
    const { data: prestamos, error } = await db
      .from("fin_loans")
      .select("id, type, contact_name, principal_amount, outstanding_amount, interest_rate, monthly_payment, payment_day, start_date, due_date, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("due_date");
    if (error) throw new Error(error.message);
    const { data: pagos, error: e2 } = await db
      .from("fin_loan_payments")
      .select("loan_id, amount, principal_paid, interest_paid, payment_date")
      .eq("user_id", userId)
      .in("loan_id", prestamos.map((p) => p.id))
      .order("payment_date", { ascending: false });
    if (e2) throw new Error(e2.message);
    const hoy = aISODia();
    return NextResponse.json({
      items: prestamos.map((p) => ({
        ...p,
        proxima_cuota: proximaCuota(hoy, p.payment_day),
        pagos: pagos.filter((x) => x.loan_id === p.id).map(({ loan_id: _, ...x }) => x),
      })),
    });
  });
}
