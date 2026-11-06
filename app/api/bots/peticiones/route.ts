import { NextResponse } from "next/server";
import { conBot, leerFiltro } from "@/lib/bots/entrada";
import { FiltroPeticion } from "@/lib/bots/esquemas";
import { tacharDatos } from "@/lib/bots/limpieza";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/peticiones?estado=pendiente — lo que Jordi ha pedido en el panel. Sin filtro, lo que sigue abierto.
// La nota de Jordi sale tachada: esto se va a un servicio de fuera.
export async function GET(request: Request) {
  return conBot(request, "peticiones:leer", async () => {
    const estado = leerFiltro(request, "estado", FiltroPeticion);
    if ("fallo" in estado) return estado.fallo;

    let consulta = supabaseAdmin().from("peticiones").select("id, tipo, video_id, motivo, texto, fecha_trabajo, siempre, estado, error, creada_en, procesada_en").order("creada_en").limit(100);
    consulta = estado.valor ? consulta.eq("estado", estado.valor) : consulta.in("estado", ["pendiente", "procesando"]);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data.map((p) => ({ ...p, texto: p.texto === null ? null : tacharDatos(p.texto) })) });
  });
}
