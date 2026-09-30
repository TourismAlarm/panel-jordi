"use server";

// Todo lo que la app escribe pasa por aquí: los formularios llaman a estas funciones.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { guardarRespuesta } from "@/lib/datos/preguntas";
import { borrarPeticion, descartarProyecto, pedirGuionNuevo } from "@/lib/datos/peticiones";
import { esMotivo } from "@/lib/estados";
import { PETICIONES_ACTIVAS } from "@/lib/funciones";

export type Resultado = { error?: string; ok?: boolean } | null;

export async function entrar(_prev: Resultado, form: FormData): Promise<Resultado> {
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/");
}

export async function salir() {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function responder(_prev: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const videoId = String(form.get("video_id") ?? "");
  const respuesta = String(form.get("respuesta") ?? "").trim();
  if (!respuesta) return { error: "Escribe algo antes de enviar." };

  const r = await guardarRespuesta(id, respuesta);
  if (r === "error") return { error: "No se ha podido guardar. Prueba otra vez." };
  if (r === "recogida") return { error: "El PC ya ha recogido esta respuesta y no se puede cambiar." };

  revalidatePath(`/videos/${videoId}`);
  revalidatePath("/");
  return { ok: true };
}

// «Este proyecto no»: queda apuntado para el PC y sale de tu lista al momento.
export async function descartar(_prev: Resultado, form: FormData): Promise<Resultado> {
  if (!PETICIONES_ACTIVAS) return { error: "Todavía no está disponible." };
  const videoId = String(form.get("video_id") ?? "");
  const motivo = String(form.get("motivo") ?? "");
  const texto = String(form.get("texto") ?? "").trim() || null;
  if (!videoId) return { error: "Falta el proyecto." };
  if (!esMotivo(motivo)) return { error: "Elige un motivo." };

  if (!(await descartarProyecto(videoId, motivo, texto))) {
    return { error: "No se ha podido guardar. Puede que ya esté descartado." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

// Guion para otro trabajo: el PC se lo pasa al guionista.
export async function pedirGuion(_prev: Resultado, form: FormData): Promise<Resultado> {
  if (!PETICIONES_ACTIVAS) return { error: "Todavía no está disponible." };
  const texto = String(form.get("texto") ?? "").trim();
  const fecha = String(form.get("fecha") ?? "").trim() || null;
  if (!texto) return { error: "Cuenta qué trabajo es." };
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha no es válida." };

  if (!(await pedirGuionNuevo(texto, fecha))) return { error: "No se ha podido guardar. Prueba otra vez." };
  revalidatePath("/", "layout");
  redirect("/");
}

// Deshacer un descarte o una petición, mientras el PC no la haya recogido.
export async function deshacer(_prev: Resultado, form: FormData): Promise<Resultado> {
  const r = await borrarPeticion(String(form.get("id") ?? ""));
  if (r === "error") return { error: "No se ha podido deshacer. Prueba otra vez." };
  if (r === "recogida") return { error: "El PC ya lo ha recogido: díselo al guionista." };
  revalidatePath("/", "layout");
  return { ok: true };
}
