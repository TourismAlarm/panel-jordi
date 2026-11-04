import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { ReglaRetirarIn } from "@/lib/bots/esquemas";
import { falloDeRegla } from "@/lib/bots/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// POST /api/bots/reglas/R0030/retirar — Antonio la deja de aplicar. No se borra: pasa a «quitada» y Jordi puede deshacerlo.
export async function POST(request: Request, { params }: { params: Promise<{ clave: string }> }) {
  return conBot(request, "reglas:escribir", async () => {
    const { clave } = await params;
    const cuerpo = await leerCuerpo(request, ReglaRetirarIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;

    const { data, error } = await supabaseAdmin().rpc("regla_retirar", { p_clave: clave, p_por_que: cuerpo.datos.por_que, p_quien: "antonio" });
    if (error) return falloDeRegla(error);
    return NextResponse.json({ ok: true, clave, version: data });
  });
}
