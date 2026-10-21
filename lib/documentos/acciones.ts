"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServidor } from "@/lib/supabase/server";
import { CATEGORIAS } from "./categorias";
import { ultimos4 } from "./contrato";

export type Resultado = { ok?: boolean; error?: string } | null;

async function usuario() {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub as string | undefined;
  return { supabase, id };
}

const Subido = z.object({ nombre: z.string().trim().min(1).max(200), ruta: z.string().min(1).max(400), mime: z.string().max(100).nullable(), tamano: z.number().int().min(0).max(26_214_400) });

// Los archivos ya están en el bucket (se suben desde el navegador, a tu carpeta). Aquí se apuntan y quedan
// «pendientes» hasta que la tarea de Claude los lea y rellene la ficha.
export async function registrarSubidos(items: unknown, categoria: string): Promise<Resultado> {
  const { supabase, id } = await usuario();
  if (!id) return { error: "No autorizado." };
  const parsed = z.array(Subido).min(1).max(30).safeParse(items);
  if (!parsed.success) return { error: "Algún archivo no es válido." };
  if (parsed.data.some((x) => !x.ruta.startsWith(`${id}/`) || x.ruta.includes(".."))) return { error: "Ruta no válida." };
  const cat = (CATEGORIAS as readonly string[]).includes(categoria) ? categoria : "Sin clasificar";
  const { error } = await supabase.from("doc_documentos").insert(parsed.data.map((x) => ({ user_id: id, nombre: x.nombre, ruta: x.ruta, mime: x.mime, tamano: x.tamano, categoria: cat, estado: "pendiente" })));
  if (error) return { error: "No se han podido registrar los archivos." };
  revalidatePath("/documentos");
  return { ok: true };
}

// Nota de texto: no necesita archivo ni Claude; ya es buscable.
export async function crearNota(_prev: Resultado, form: FormData): Promise<Resultado> {
  const { supabase, id } = await usuario();
  if (!id) return { error: "No autorizado." };
  const nombre = String(form.get("nombre") ?? "").trim().slice(0, 200);
  const texto = String(form.get("texto") ?? "").trim().slice(0, 20_000);
  if (!nombre || !texto) return { error: "Escribe un título y el texto." };
  const { data, error } = await supabase.from("doc_documentos").insert({ user_id: id, nombre, categoria: "Notas", tipo: "Nota", estado: "nota", mime: "text/plain", procesado_en: new Date().toISOString() }).select("id").single();
  if (error || !data) return { error: "No se ha podido guardar la nota." };
  const p = await supabase.from("doc_paginas").insert({ documento_id: data.id, user_id: id, pagina: 1, texto });
  if (p.error) return { error: "No se ha podido guardar el texto de la nota." };
  revalidatePath("/documentos");
  redirect(`/documentos/${data.id}`);
}

const fecha = z.preprocess((v) => (v === "" || v == null ? null : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable());
const lineas = (max: number) => z.preprocess((v) => String(v ?? "").split("\n").map((x) => x.trim()).filter(Boolean), z.array(z.string().max(240)).max(max));

const EsquemaFicha = z.object({
  id: z.string().uuid(),
  categoria: z.enum([...CATEGORIAS, "Sin clasificar"]),
  tipo: z.string().trim().max(80).optional(),
  referencia: z.string().trim().max(60).optional(),
  inicio: fecha,
  vencimiento: fecha,
  contacto: z.string().trim().max(200).optional(),
  partes: lineas(8),
  condiciones: lineas(3),
  importes: lineas(10),
});

// «Concepto: 123,45» por línea.
function importesDe(lineasTexto: string[]) {
  return lineasTexto.flatMap((l) => {
    const m = l.match(/^(.*?)[:=]\s*(-?[\d.]+(?:,\d+)?)\s*€?$/);
    if (!m) return [];
    const importe = Number(m[2].replace(/\./g, "").replace(",", "."));
    return Number.isFinite(importe) ? [{ concepto: m[1].trim().slice(0, 80) || "Importe", importe }] : [];
  });
}

// Corregir o rellenar la ficha a mano (lo que Claude no haya sacado o haya sacado mal).
export async function guardarFicha(_prev: Resultado, form: FormData): Promise<Resultado> {
  const { supabase, id: userId } = await usuario();
  if (!userId) return { error: "No autorizado." };
  const p = EsquemaFicha.safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Revisa las fechas (día-mes-año) y los datos." };
  const d = p.data;

  const a = await supabase.from("doc_documentos").update({ categoria: d.categoria, tipo: d.tipo || null }).eq("id", d.id);
  if (a.error) return { error: "No se ha podido guardar." };
  const b = await supabase.from("doc_fichas").upsert({
    documento_id: d.id, user_id: userId, partes: d.partes, referencia: ultimos4(d.referencia), inicio: d.inicio, vencimiento: d.vencimiento,
    contacto: d.contacto || null, condiciones: d.condiciones, importes: importesDe(d.importes), origen: "manual", actualizado_en: new Date().toISOString(),
  });
  if (b.error) return { error: "No se ha podido guardar la ficha." };
  revalidatePath("/documentos", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function borrarDocumento(form: FormData): Promise<void> {
  const { supabase, id } = await usuario();
  const docId = String(form.get("id") ?? "");
  if (!id || !/^[0-9a-f-]{36}$/.test(docId)) return;
  const { data } = await supabase.from("doc_documentos").select("ruta").eq("id", docId).maybeSingle();
  if (data?.ruta) await supabase.storage.from("documentos").remove([data.ruta]);
  await supabase.from("doc_documentos").delete().eq("id", docId);
  revalidatePath("/documentos", "layout");
  revalidatePath("/");
  redirect("/documentos");
}
