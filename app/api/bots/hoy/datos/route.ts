import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { FechaIso } from "@/lib/bots/esquemas";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia, diasHasta } from "@/lib/fechas";
import { DIAS_TACHADO, estadoCosas, leerPrioridades } from "@/lib/hoy/prioridades";
import { reunirHoy } from "@/lib/hoy/reunir";
import { leerTachadas } from "@/lib/hoy/tachadas";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Cosas = ReturnType<typeof estadoCosas>;
// Lo que pusiste ese día y cómo va: `hecha`, `como` («a mano» si la tachó Jordi, «sola» si la resolvió en su página)
// y `hecha_el` (el día en que la tachó, si fue a mano; puede ser un día anterior si ya la había tachado entonces).
const cosasParaBot = (cosas: Cosas) => cosas.map(({ texto, nivel, enlace, hecha, como, hecha_el }) => ({ texto, nivel: nivel ?? null, enlace: enlace ?? null, hecha, como, hecha_el }));

// GET /api/bots/hoy/datos — lo mismo que reúne la pantalla de Hoy. Agenda y correo son lo que publicó Antonio para hoy (no Google).
// correos_sin_leer queda vacío solo por compatibilidad: usa `correos`.
// Con ?fecha= de uno de los 14 días anteriores, solo `fecha` y `cosas_de_hoy` de ese día.
export async function GET(request: Request) {
  return conBot(request, "hoy:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "hoy:leer");
    if ("fallo" in firma) return firma.fallo;
    const hoy = aISODia();
    const fecha = new URL(request.url).searchParams.get("fecha");
    if (fecha && fecha !== hoy) {
      const atras = FechaIso.safeParse(fecha).success ? diasHasta(hoy, fecha) : NaN;
      if (!(atras >= 1 && atras <= DIAS_TACHADO)) return NextResponse.json({ error: `solo hoy o uno de los ${DIAS_TACHADO} días anteriores` }, { status: 400 });
      return NextResponse.json(await diaPasado(fecha));
    }
    const foto = await reunirHoy(supabaseAdmin(), await duenoId(), { soloLectura: true });
    return NextResponse.json({
      fecha: foto.fecha,
      senales: foto.senales,
      agenda: foto.eventos,
      correos: foto.correos,
      agenda_en: foto.agendaEn,
      correos_en: foto.correosEn,
      correos_sin_leer: [],
      cosas_de_hoy: cosasParaBot(estadoCosas(leerPrioridades(foto.guardado?.prioridades), foto.guardado?.marcas, foto.abierto, { fecha: foto.fecha, tachadas: foto.tachadas })),
      salud: foto.salud,
      fallos: foto.fallos,
    });
  });
}

// Un día pasado: sus cosas con lo tachado a mano (ese día o en los 14 anteriores). «sola» se mira con cómo está todo ahora:
// si lo enlazado ya está resuelto, cuenta como hecho.
async function diaPasado(fecha: string) {
  const db = supabaseAdmin();
  const id = await duenoId();
  const [fila, tachadas, foto] = await Promise.all([
    db.from("resumenes_diarios").select("prioridades, marcas").eq("user_id", id).eq("fecha", fecha).maybeSingle(),
    leerTachadas(db, id, fecha),
    reunirHoy(db, id, { soloLectura: true }),
  ]);
  if (fila.error) throw new Error(fila.error.message);
  return { fecha, cosas_de_hoy: cosasParaBot(estadoCosas(leerPrioridades(fila.data?.prioridades), fila.data?.marcas, foto.abierto, { fecha, tachadas })) };
}
