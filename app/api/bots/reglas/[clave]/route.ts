import { NextResponse } from "next/server";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { ReglaCambioIn } from "@/lib/bots/esquemas";
import { falloDeRegla } from "@/lib/bots/reglas";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PATCH /api/bots/reglas/R0030 — Antonio cambia el texto de una regla activa. El anterior queda en el historial.
export async function PATCH(request: Request, { params }: { params: Promise<{ clave: string }> }) {
  return conBot(request, "reglas:escribir", async () => {
    const { clave } = await params;
    const cuerpo = await leerCuerpo(request, ReglaCambioIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;

    const { data, error } = await supabaseAdmin().rpc("regla_editar", { p_clave: clave, p_regla: cuerpo.datos.regla, p_por_que: cuerpo.datos.por_que, p_quien: "antonio" });
    if (error) return falloDeRegla(error);
    return NextResponse.json({ ok: true, clave, version: data });
  });
}
