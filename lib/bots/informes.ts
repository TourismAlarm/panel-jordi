import "server-only";
import { NextResponse } from "next/server";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/tipos";
import type { Bot } from "./catalogo";
import { firmante, leerCuerpo } from "./entrada";
import { InformeIn } from "./esquemas";

// Un informe queda a nombre del módulo de la ruta, firme quien firme: lo de Salud no puede acabar en Finanzas.
export async function guardarInforme(request: Request, clave: Bot, modulo: "finanzas" | "salud") {
  const cuerpo = await leerCuerpo(request, InformeIn);
  if ("fallo" in cuerpo) return cuerpo.fallo;
  const { bot, datos, ...informe } = cuerpo.datos;
  const firma = firmante(clave, bot, `${modulo}:informe`);
  if ("fallo" in firma) return firma.fallo;
  const { data, error } = await supabaseAdmin()
    .from("informes_bots")
    .insert({ ...informe, datos: datos as Json, bot: modulo, user_id: await duenoId() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
