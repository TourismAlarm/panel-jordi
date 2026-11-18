import { NextResponse } from "next/server";
import { nombreBot } from "@/lib/bots/catalogo";
import { conBot, conDatosDeCliente, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { VideoNuevoIn } from "@/lib/bots/esquemas";
import { guionParaBot, tacharDatos } from "@/lib/bots/limpieza";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/videos — lo que Antonio tiene que revisar (por_revisar). Con ?id=GE_012, ese vídeo.
// El guion sale sin cabecera y con los datos reconocibles tachados: esto se va a un servicio de fuera.
export async function GET(request: Request) {
  return conBot(request, "videos:leer", async () => {
    const id = new URL(request.url).searchParams.get("id");
    if (id !== null && !/^GE_\d{3,}$/.test(id)) return NextResponse.json({ error: "id no válido" }, { status: 400 });

    let consulta = supabaseAdmin().from("videos").select("id, titulo, estado, por_revisar, montaje_url, guion_md, actualizado_en").order("actualizado_en", { ascending: false }).limit(50);
    consulta = id ? consulta.eq("id", id) : consulta.eq("por_revisar", true);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    const items = data.map(({ guion_md, titulo, ...v }) => ({ ...v, titulo: titulo === null ? null : tacharDatos(titulo), guion_md: guionParaBot(guion_md) }));
    return NextResponse.json({ items });
  });
}

// POST /api/bots/videos — Antonio crea el GE de un material que Jordi ya subió a Drive (Nuevos/<carpeta>).
// No crea carpeta: guarda la que le dan como la de los brutos. La misma carpeta otra vez → 409 con el vídeo que ya tiene.
// Una sola escritura (la función numera e inserta); después se apunta en Actividad.
export async function POST(request: Request) {
  return conBot(request, "videos:crear", async (clave) => {
    const cuerpo = await leerCuerpo(request, VideoNuevoIn);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const d = cuerpo.datos;
    const firma = firmante(clave, d.bot, "videos:crear");
    if ("fallo" in firma) return firma.fallo;
    const conDatos = conDatosDeCliente({ titulo: d.titulo, nota: d.nota ?? "" });
    if (conDatos) return conDatos;

    const db = supabaseAdmin();
    const { data, error } = await db.rpc("crear_ge_de_carpeta", {
      p_titulo: d.titulo,
      p_carpeta: d.carpeta_drive_id,
      p_sin_guion: d.sin_guion,
      p_estado: d.estado,
      p_fecha: (d.fecha_trabajo ?? null) as string, // el tipo generado no admite null
    });
    if (error) throw new Error(error.message);
    const { id, nuevo } = data as { id: string; nuevo: boolean };
    const enlace = `/elsa/videos/${id}`;
    if (!nuevo) return NextResponse.json({ error: "esa carpeta ya tiene vídeo", id, enlace }, { status: 409 });

    const ahora = new Date().toISOString();
    const { error: eActividad } = await db.from("actividad_bots").insert({
      bot: firma.autor,
      tarea: `${id} creado por ${nombreBot(firma.autor)}${d.sin_guion ? " (sin guion)" : ""}`,
      inicio: ahora,
      fin: ahora,
      resultado: "ok",
      nota: [d.titulo, d.nota].filter(Boolean).join(" · ").slice(0, 2000),
      enlace: `https://drive.google.com/drive/folders/${d.carpeta_drive_id}`,
    });
    if (eActividad) console.error("Bots · actividad del vídeo nuevo:", eActividad.message);

    return NextResponse.json({ ok: true, id, enlace }, { status: 201 });
  });
}
