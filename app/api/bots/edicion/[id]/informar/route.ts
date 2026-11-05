import { NextResponse } from "next/server";
import { avisarAntonio } from "@/lib/bots/aviso";
import { preguntasNuevas, RESULTADO_ACTIVIDAD } from "@/lib/bots/edicion";
import { conBot, conDatosDeCliente, leerCuerpo } from "@/lib/bots/entrada";
import { InformarIn } from "@/lib/bots/esquemas";
import { supabaseAdmin } from "@/lib/supabase/admin";

const SIGUIENTE = {
  listo: "Montado: lo revisa Antonio",
  bloqueado: "El PC ha preguntado algo a Antonio",
  fallido: "El montaje ha fallado: lo ve Antonio",
};

// POST /api/bots/edicion/{id}/informar — el PC entrega, pregunta, avisa de un fallo o dice que ya copió el FINAL.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return conBot(request, "edicion:informar", async () => {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });
    const cuerpo = await leerCuerpo(request, InformarIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const conDatos = conDatosDeCliente(cuerpo.datos);
    if (conDatos) return conDatos;
    const d = cuerpo.datos;

    const db = supabaseAdmin();
    const ahora = new Date().toISOString();
    if (d.estado === "final") {
      const { data, error } = await db.from("encargos_edicion").update({ final_url: d.resultado_url }).eq("id", id).eq("estado", "aprobado").select("video_id");
      if (error) throw new Error(error.message);
      if (!data.length) return NextResponse.json({ error: "ese encargo no está aprobado" }, { status: 409 });
      const { error: eVideo } = await db.from("videos").update({ montaje_url: d.resultado_url, siguiente_paso: null, actualizado_en: ahora }).eq("id", data[0].video_id);
      if (eVideo) throw new Error(eVideo.message);
      return NextResponse.json({ ok: true });
    }

    const { data, error } = await db
      .from("encargos_edicion")
      .update({
        estado: d.estado,
        terminado_en: ahora,
        resultado_notas: d.notas ?? null,
        ...(d.estado === "listo" ? { resultado_url: d.resultado_url, duracion_real_s: d.duracion_real_s } : {}),
        ...(d.estado === "bloqueado" ? { preguntas: preguntasNuevas(d.preguntas) } : {}),
        ...(d.estado === "fallido" ? { error: d.error } : {}),
      })
      .eq("id", id)
      .eq("estado", "en_curso")
      .select("video_id, version, tomado_en");
    if (error) throw new Error(error.message);
    if (!data.length) return NextResponse.json({ error: "ese encargo no está en curso" }, { status: 409 });
    const e = data[0];

    const { error: eVideo } = await db.from("videos").update({ siguiente_paso: SIGUIENTE[d.estado], actualizado_en: ahora }).eq("id", e.video_id);
    if (eVideo) throw new Error(eVideo.message);
    const { error: eActividad } = await db.from("actividad_bots").insert({
      bot: "editor",
      tarea: `Encargo ${e.video_id} v${e.version}`,
      inicio: e.tomado_en ?? ahora,
      fin: ahora,
      resultado: RESULTADO_ACTIVIDAD[d.estado],
      nota: d.estado === "fallido" ? d.error : d.estado === "bloqueado" ? d.preguntas.join(" · ") : (d.notas ?? null),
      enlace: d.estado === "listo" ? d.resultado_url : null,
    });
    if (eActividad) console.error("Bots · actividad del editor:", eActividad.message);

    avisarAntonio({ evento: "edicion_lista", encargo_id: id, video_id: e.video_id, version: e.version, estado: d.estado });
    return NextResponse.json({ ok: true });
  });
}
