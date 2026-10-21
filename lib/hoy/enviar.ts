import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enviarCorreo } from "@/lib/resend";
import { correoDelResumen } from "./correo";
import { reunirHoy } from "./reunir";
import { redactarResumen } from "./resumen-ia";

async function duenoId(): Promise<string> {
  const { data, error } = await supabaseAdmin().from("permitidos").select("user_id").limit(1).single();
  if (error) throw new Error(`No hay usuario permitido: ${error.message}`);
  return data.user_id;
}

export type Resultado = { estado: "enviado" | "ya-enviado" | "guardado-sin-correo"; fecha: string; conIA: boolean; fallos: string[]; errorCorreo?: string };

// Genera el resumen de hoy, lo guarda y lo manda por correo (a ti mismo). Una vez al día, salvo forzar.
// Si el correo falla, el resumen queda guardado igualmente y se apunta el motivo.
export async function generarYEnviarResumen(opciones: { forzar?: boolean } = {}): Promise<Resultado> {
  const admin = supabaseAdmin();
  const userId = await duenoId();
  const foto = await reunirHoy(admin, userId);

  if (!opciones.forzar) {
    const { data } = await admin.from("resumenes_diarios").select("enviado_en").eq("user_id", userId).eq("fecha", foto.fecha).maybeSingle();
    if (data?.enviado_en) return { estado: "ya-enviado", fecha: foto.fecha, conIA: false, fallos: foto.fallos };
  }

  const r = await redactarResumen(foto);
  const fila = {
    user_id: userId,
    fecha: foto.fecha,
    resumen: r.resumen,
    prioridades: r.prioridades,
    senales: { senales: foto.senales, fallos: foto.fallos, correos: foto.correos.length, eventos: foto.eventos.length },
    generado_en: new Date().toISOString(),
    enviado_en: null,
    error_envio: null,
  };
  const { error } = await admin.from("resumenes_diarios").upsert(fila, { onConflict: "user_id,fecha" });
  if (error) throw new Error(`No se pudo guardar el resumen: ${error.message}`);

  try {
    const c = correoDelResumen(foto, r, process.env.APP_URL?.trim() || "https://panel-jordi.vercel.app");
    await enviarCorreo({ asunto: c.asunto, html: c.html, texto: c.texto });
    await admin.from("resumenes_diarios").update({ enviado_en: new Date().toISOString() }).eq("user_id", userId).eq("fecha", foto.fecha);
    return { estado: "enviado", fecha: foto.fecha, conIA: r.conIA, fallos: foto.fallos };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    await admin.from("resumenes_diarios").update({ error_envio: motivo.slice(0, 300) }).eq("user_id", userId).eq("fecha", foto.fecha);
    return { estado: "guardado-sin-correo", fecha: foto.fecha, conIA: r.conIA, fallos: foto.fallos, errorCorreo: motivo };
  }
}
