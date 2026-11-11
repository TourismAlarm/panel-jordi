import { NextResponse } from "next/server";
import { conBot, firmanteDeUrl } from "@/lib/bots/entrada";
import { duenoId } from "@/lib/datos/dueno";
import { aISODia } from "@/lib/fechas";
import { estadoCosas, leerMarcas, leerPrioridades } from "@/lib/hoy/prioridades";
import { reunirHoy } from "@/lib/hoy/reunir";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/bots/hoy/datos — lo mismo que reúne la pantalla de Hoy. Agenda y correo son lo que publicó Antonio para hoy (no Google).
// correos_sin_leer queda vacío solo por compatibilidad: usa `correos`.
export async function GET(request: Request) {
  return conBot(request, "hoy:leer", async (clave) => {
    const firma = firmanteDeUrl(request, clave, "hoy:leer");
    if ("fallo" in firma) return firma.fallo;
    const fecha = new URL(request.url).searchParams.get("fecha");
    if (fecha && fecha !== aISODia()) return NextResponse.json({ error: "solo se reúne el día de hoy" }, { status: 400 });
    const foto = await reunirHoy(supabaseAdmin(), await duenoId(), { soloLectura: true });
    return NextResponse.json({
      fecha: foto.fecha,
      senales: foto.senales,
      agenda: foto.eventos,
      correos: foto.correos,
      agenda_en: foto.agendaEn,
      correos_en: foto.correosEn,
      correos_sin_leer: [],
      // Lo que le pusiste para hoy y cómo va: `hecha`, y `como` («a mano» si la tachó Jordi, «sola» si la resolvió en su página).
      cosas_de_hoy: estadoCosas(leerPrioridades(foto.guardado?.prioridades), leerMarcas(foto.guardado?.marcas), foto.abierto).map(({ texto, nivel, enlace, hecha, como }) => ({ texto, nivel: nivel ?? null, enlace: enlace ?? null, hecha, como })),
      salud: foto.salud,
      fallos: foto.fallos,
    });
  });
}
