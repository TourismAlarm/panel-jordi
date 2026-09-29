"use server";

// Todo lo que la app escribe pasa por aquí: los formularios llaman a estas funciones.

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { guardarRespuesta } from "@/lib/datos/preguntas";

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
