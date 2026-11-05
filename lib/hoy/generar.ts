import "server-only";
import { duenoId } from "@/lib/datos/dueno";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { reunirHoy } from "./reunir";
import { resumenSencillo } from "./resumen-sencillo";

export type Generado = { fecha: string; fallos: string[]; yaExistia?: boolean };

// Guarda el resumen sencillo de hoy (tabla resumenes_diarios). Una vez al día salvo «forzar».
// Sin correo: se lee en la app. Nunca pisa el que ha escrito el bot Día.
export async function generarResumen(opciones: { forzar?: boolean; userId?: string } = {}): Promise<Generado> {
  const admin = supabaseAdmin();
  const userId = opciones.userId ?? (await duenoId());
  const foto = await reunirHoy(admin, userId);

  const { data } = await admin.from("resumenes_diarios").select("origen").eq("user_id", userId).eq("fecha", foto.fecha).maybeSingle();
  if (data && (!opciones.forzar || data.origen === "bot")) return { fecha: foto.fecha, fallos: foto.fallos, yaExistia: true };

  const r = resumenSencillo(foto);
  const { error } = await admin.from("resumenes_diarios").upsert(
    {
      user_id: userId,
      fecha: foto.fecha,
      resumen: r.resumen,
      prioridades: r.prioridades,
      senales: { fallos: foto.fallos },
      origen: "cron",
      generado_en: new Date().toISOString(),
      enviado_en: null,
      error_envio: null,
    },
    { onConflict: "user_id,fecha" },
  );
  if (error) throw new Error(`No se pudo guardar el resumen: ${error.message}`);
  return { fecha: foto.fecha, fallos: foto.fallos };
}
