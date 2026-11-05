import { conBot } from "@/lib/bots/entrada";
import { guardarInforme } from "@/lib/bots/informes";

// POST /api/bots/finanzas/informe — el bot de Finanzas deja su informe. Sale en Finanzas, en «Último informe». No envía nada.
export async function POST(request: Request) {
  return conBot(request, "finanzas:informe", (clave) => guardarInforme(request, clave, "finanzas"));
}
