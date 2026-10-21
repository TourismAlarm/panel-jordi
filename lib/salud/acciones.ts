"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { aISODia } from "@/lib/fechas";
import { supabaseServidor } from "@/lib/supabase/server";
import { ETIQUETAS_SINTOMA, necesitaAvisoMedico } from "./seguridad";

export type ResultadoRegistro = { ok?: boolean; error?: string; avisoMedico?: boolean; guardado?: string[] } | null;

const numero = z.preprocess((v) => (v === "" || v == null ? undefined : Number(String(v).replace(",", "."))), z.number().finite().optional());
const Esquema = z.object({
  animo: numero.pipe(z.number().int().min(1).max(5).optional()),
  energia: numero.pipe(z.number().int().min(1).max(5).optional()),
  peso: numero.pipe(z.number().min(20).max(300).optional()),
  sintoma: z.enum(ETIQUETAS_SINTOMA.map((e) => e.id) as [string, ...string[]]).optional().or(z.literal("")),
  intensidad: numero.pipe(z.number().int().min(1).max(5).optional()),
  condicion: z.string().trim().max(300).optional(),
  nota: z.string().trim().max(1000).optional(),
});

// Lo que apuntas a mano: ánimo, energía y peso van a las gráficas; síntomas, condiciones y notas, a «registros».
export async function guardarRegistro(_prev: ResultadoRegistro, form: FormData): Promise<ResultadoRegistro> {
  const parsed = Esquema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Algún dato no es válido. Revisa los números." };
  const d = parsed.data;
  const hoy = aISODia();

  const supabase = await supabaseServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return { error: "Sesión caducada. Vuelve a entrar." };

  const guardado: string[] = [];
  const metricas = [
    d.animo !== undefined && { metrica: "animo", valor: d.animo, unidad: "/5" },
    d.energia !== undefined && { metrica: "energia", valor: d.energia, unidad: "/5" },
    d.peso !== undefined && { metrica: "peso_kg", valor: d.peso, unidad: "kg" },
  ].filter(Boolean) as { metrica: string; valor: number; unidad: string }[];
  if (metricas.length) {
    const { error } = await supabase.from("sal_metricas").upsert(
      metricas.map((m) => ({ user_id: userId, fecha: hoy, fuente: "manual", actualizado_en: new Date().toISOString(), ...m })),
      { onConflict: "user_id,fecha,metrica,fuente" },
    );
    if (error) return { error: "No se ha podido guardar. Prueba otra vez." };
    guardado.push(...metricas.map((m) => m.metrica));
  }

  const registros: { tipo: "sintoma" | "condicion" | "nota"; etiqueta: string | null; texto: string | null; intensidad: number | null }[] = [];
  if (d.sintoma) registros.push({ tipo: "sintoma", etiqueta: d.sintoma, texto: d.nota || null, intensidad: d.intensidad ?? null });
  if (d.condicion) registros.push({ tipo: "condicion", etiqueta: null, texto: d.condicion, intensidad: null });
  if (d.nota && !d.sintoma) registros.push({ tipo: "nota", etiqueta: null, texto: d.nota, intensidad: null });

  let avisoMedico = false;
  for (const r of registros) {
    const aviso = necesitaAvisoMedico(r);
    avisoMedico ||= aviso;
    const { error } = await supabase.from("sal_registros").insert({ user_id: userId, fecha: hoy, aviso_medico: aviso, ...r });
    if (error) return { error: "No se ha podido guardar. Prueba otra vez." };
    guardado.push(r.tipo);
  }
  if (!guardado.length) return { error: "No has rellenado nada." };

  revalidatePath("/salud");
  return { ok: true, avisoMedico, guardado };
}
