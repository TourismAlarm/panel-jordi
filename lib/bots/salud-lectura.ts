import "server-only";
import { NextResponse } from "next/server";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { leerPagina, leerRango, pagina } from "./consultas";
import { conBot, firmanteDeUrl } from "./entrada";

const COLUMNAS = {
  sal_metricas: "id, fecha, metrica, valor, unidad, fuente",
  sal_entrenos: "id, fecha, tipo, duracion_min, distancia_km, calorias, fc_media, fuente",
  sal_registros: "id, fecha, creado_en, tipo, etiqueta, texto, intensidad, aviso_medico",
} as const;

// Lo común de los GET de Salud: solo el bot de Salud, solo lectura, por fechas y por páginas.
export function leerSaludBot(request: Request, tabla: keyof typeof COLUMNAS, filtro?: { columna: "metrica"; valor: string | null }) {
  return conBot(request, "salud:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "salud:leer");
    if ("fallo" in firma) return firma.fallo;
    const rango = leerRango(request);
    if ("fallo" in rango) return rango.fallo;
    const pag = leerPagina(request);
    if ("fallo" in pag) return pag.fallo;
    let consulta = supabaseAdmin()
      .from(tabla as "sal_metricas")
      .select(COLUMNAS[tabla])
      .eq("user_id", await duenoId())
      .gte("fecha", rango.desde)
      .lte("fecha", rango.hasta)
      .order("fecha", { ascending: false })
      .order("id")
      .range(pag.inicio, pag.inicio + pag.limite);
    if (filtro?.valor) consulta = consulta.eq(filtro.columna, filtro.valor);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return NextResponse.json(pagina(data, pag));
  });
}
