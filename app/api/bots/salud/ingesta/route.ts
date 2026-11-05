import { NextResponse } from "next/server";
import { conBot, firmante, leerCuerpo } from "@/lib/bots/entrada";
import { IdBot } from "@/lib/bots/esquemas";
import { guardarIngesta } from "@/lib/salud/guardar-ingesta";
import { CuerpoIngestaBot } from "@/lib/salud/ingesta";

export const maxDuration = 60;

const IngestaBot = CuerpoIngestaBot(IdBot);

// POST /api/bots/salud/ingesta — el bot de Salud deja lo que ha leído de Garmin. Repetir el envío no duplica. Lo apuntado a mano no se toca.
export async function POST(request: Request) {
  return conBot(request, "salud:escribir", async (clave) => {
    const cuerpo = await leerCuerpo(request, IngestaBot);
    if ("fallo" in cuerpo) return cuerpo.fallo;
    const { bot, ...datos } = cuerpo.datos;
    const firma = firmante(clave, bot, "salud:escribir");
    if ("fallo" in firma) return firma.fallo;
    return NextResponse.json({ ok: true, ...(await guardarIngesta(datos)) });
  });
}
