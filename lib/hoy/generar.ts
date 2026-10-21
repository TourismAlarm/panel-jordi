import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reunirHoy } from "./reunir";
import { redactarResumen } from "./resumen-ia";

async function duenoId(): Promise<string> {
  const { data, error } = await supabaseAdmin().from("permitidos").select("user_id").limit(1).single();
  if (error) throw new Error(`No hay usuario permitido: ${error.message}`);
  return data.user_id;
}

export type Generado = { fecha: string; conIA: boolean; fallos: string[]; yaExistia?: boolean };

// Genera el resumen de hoy con la IA y lo guarda (tabla resumenes_diarios). Una vez al día salvo «forzar».
// Sin correo: se lee en la app. Si la IA falla o no hay clave, se guarda un resumen simple con las señales.
export async function generarResumen(opciones: { forzar?: boolean; userId?: string } = {}): Promise<Generado> {
  const admin = supabaseAdmin();
  const userId = opciones.userId ?? (await duenoId());
  const foto = await reunirHoy(admin, userId);

  if (!opciones.forzar) {
    const { data } = await admin.from("resumenes_diarios").select("id").eq("user_id", userId).eq("fecha", foto.fecha).maybeSingle();
    if (data) return { fecha: foto.fecha, conIA: false, fallos: foto.fallos, yaExistia: true };
  }

  const r = await redactarResumen(foto);
  const { error } = await admin.from("resumenes_diarios").upsert(
    {
      user_id: userId,
      fecha: foto.fecha,
      resumen: r.resumen,
      prioridades: r.prioridades,
      senales: { fallos: foto.fallos, conIA: r.conIA },
      generado_en: new Date().toISOString(),
      enviado_en: null,
      error_envio: null,
    },
    { onConflict: "user_id,fecha" },
  );
  if (error) throw new Error(`No se pudo guardar el resumen: ${error.message}`);
  return { fecha: foto.fecha, conIA: r.conIA, fallos: foto.fallos };
}
