"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";

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

  const supabase = await supabaseServidor();
  // RLS: solo pasa si eres un usuario permitido y la respuesta aún no la ha recogido el sync.
  const { data, error } = await supabase
    .from("preguntas")
    .update({ respuesta, respondida_en: new Date().toISOString() })
    .eq("id", id)
    .select("id");
  if (error) return { error: "No se ha podido guardar. Prueba otra vez." };
  if (!data?.length) return { error: "Esta respuesta ya está recogida en preguntas.md y no se puede cambiar." };

  revalidatePath(`/videos/${videoId}`);
  return { ok: true };
}
