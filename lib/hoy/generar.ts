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

  // Atajo: ya hay resumen y no se fuerza. La protección de verdad está en la función de la base.
  if (foto.guardado && (!opciones.forzar || foto.guardado.origen === "bot")) return { fecha: foto.fecha, fallos: foto.fallos, yaExistia: true };

  const r = resumenSencillo(foto);
  const { data: escrito, error } = await admin.rpc("hoy_guardar_resumen_sencillo", {
    p_user: userId,
    p_fecha: foto.fecha,
    p_resumen: r.resumen,
    p_prioridades: r.prioridades,
    p_senales: { fallos: foto.fallos },
    p_forzar: !!opciones.forzar,
  });
  if (error) throw new Error(`No se pudo guardar el resumen: ${error.message}`);
  return { fecha: foto.fecha, fallos: foto.fallos, ...(escrito ? {} : { yaExistia: true }) };
}
