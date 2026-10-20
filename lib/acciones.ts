"use server";

// Todo lo que la app escribe pasa por aquí: los formularios llaman a estas funciones.

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServidor } from "@/lib/supabase/server";
import { guardarRespuesta } from "@/lib/datos/preguntas";
import { borrarPeticion, confirmarMaterial, descartarProyecto, pedirEdicionSinGuion, pedirGuionNuevo, pedirRevision } from "@/lib/datos/peticiones";
import { guardarDecision } from "@/lib/datos/reglas";
import { guardarRespuestaBandeja, marcarLeido } from "@/lib/datos/bandeja";
import { esMotivo } from "@/lib/estados";
import { PETICIONES_ACTIVAS } from "@/lib/funciones";

export type Resultado = { error?: string; ok?: boolean } | null;

// Login único: Google. Solo entra el correo de ALLOWED_EMAIL (se comprueba en /auth/callback y en el proxy).
export async function entrarConGoogle() {
  const cab = await headers();
  const host = cab.get("x-forwarded-host") ?? cab.get("host");
  const proto = cab.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${proto}://${host}/auth/callback`, queryParams: { prompt: "select_account" } },
  });
  if (error || !data.url) redirect("/login?error=google");
  redirect(data.url);
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

  revalidatePath(`/elsa/videos/${videoId}`);
  revalidatePath("/elsa");
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
  redirect("/elsa");
}

// «Ya lo he grabado»: una urgencia sin guion. El PC crea el proyecto con su carpeta para subir el material.
export async function pedirEdicion(_prev: Resultado, form: FormData): Promise<Resultado> {
  if (!PETICIONES_ACTIVAS) return { error: "Todavía no está disponible." };
  const texto = String(form.get("texto") ?? "").trim();
  const fecha = String(form.get("fecha") ?? "").trim() || null;
  if (!texto) return { error: "Cuenta qué trabajo es." };
  if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "La fecha no es válida." };

  if (!(await pedirEdicionSinGuion(texto, fecha))) return { error: "No se ha podido guardar. Prueba otra vez." };
  revalidatePath("/", "layout");
  redirect("/elsa");
}

// Revisar el montaje sin salir del panel: «Corte OK» (el corte), aprobar (el acabado), o pedir cambios con el texto de qué cambiar.
export async function revisarMontaje(_prev: Resultado, form: FormData): Promise<Resultado> {
  const videoId = String(form.get("video_id") ?? "");
  const tipo = String(form.get("tipo") ?? "");
  const texto = String(form.get("texto") ?? "").trim();
  if (!videoId) return { error: "Falta el proyecto." };
  if (tipo !== "aprobar" && tipo !== "cambios" && tipo !== "corte_ok") return { error: "Acción no válida." };
  if (tipo === "cambios" && !texto) return { error: "Escribe qué quieres cambiar." };

  const siempre = tipo === "cambios" && form.get("siempre") === "on";
  if (!(await pedirRevision(videoId, tipo, tipo === "cambios" ? texto : null, siempre))) {
    return { error: "No se ha podido guardar. Prueba otra vez." };
  }
  revalidatePath(`/elsa/videos/${videoId}`);
  revalidatePath("/elsa");
  return { ok: true };
}

// «Ya he subido todo el material»: hasta que lo pulsas, el PC no empieza a procesar ni a montar el vídeo.
export async function materialListo(_prev: Resultado, form: FormData): Promise<Resultado> {
  const videoId = String(form.get("video_id") ?? "");
  if (!videoId) return { error: "Falta el proyecto." };
  if (!(await confirmarMaterial(videoId))) return { error: "No se ha podido guardar. Prueba otra vez." };
  revalidatePath(`/elsa/videos/${videoId}`);
  revalidatePath("/elsa");
  return { ok: true };
}

// Lo que aprenden los agentes: sí / no / sí cambiada a una propuesta, quitar una activa, o deshacer.
export async function decidirRegla(_prev: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const que = String(form.get("decision") ?? "");
  const texto = String(form.get("texto") ?? "").trim() || null;
  if (!id) return { error: "Falta la regla." };
  if (que !== "si" && que !== "no" && que !== "quitar" && que !== "deshacer") return { error: "Acción no válida." };
  const r = await guardarDecision(id, que === "deshacer" ? null : que, que === "si" ? texto : null);
  if (r === "error") return { error: "No se ha podido guardar. Prueba otra vez." };
  if (r === "recogida") return { error: "El PC ya la ha aplicado: no se puede cambiar desde aquí." };
  revalidatePath("/elsa/aprendizaje");
  revalidatePath("/elsa");
  return { ok: true };
}

// Deshacer un descarte o una petición, mientras el PC no la haya recogido.
export async function deshacer(_prev: Resultado, form: FormData): Promise<Resultado> {
  const r = await borrarPeticion(String(form.get("id") ?? ""));
  if (r === "error") return { error: "No se ha podido deshacer. Prueba otra vez." };
  if (r === "recogida") return { error: "El PC ya lo ha recogido: díselo al guionista." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// ── Bandeja común ─────────────────────────────────────────────
export async function leerAviso(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (id) await marcarLeido(id);
  revalidatePath("/", "layout");
}

export async function responderAviso(_prev: Resultado, form: FormData): Promise<Resultado> {
  const id = String(form.get("id") ?? "");
  const respuesta = String(form.get("respuesta") ?? "").trim();
  if (!id) return { error: "Falta el aviso." };
  if (!respuesta) return { error: "Escribe algo antes de enviar." };
  if (!(await guardarRespuestaBandeja(id, respuesta))) return { error: "No se ha podido guardar. Prueba otra vez." };
  revalidatePath("/", "layout");
  return { ok: true };
}
