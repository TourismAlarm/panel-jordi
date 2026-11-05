import { conBot } from "@/lib/bots/entrada";
import { guardarInforme } from "@/lib/bots/informes";

// POST /api/bots/salud/informe — el bot de Salud deja su informe. Sale en Salud, en «Último informe». No envía nada.
export async function POST(request: Request) {
  return conBot(request, "salud:informe", (clave) => guardarInforme(request, clave, "salud"));
}
