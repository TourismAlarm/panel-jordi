import { leerSaludBot } from "@/lib/bots/salud-lectura";

// GET /api/bots/salud/metricas?desde=&hasta=&metrica=&limite=&cursor=
export async function GET(request: Request) {
  return leerSaludBot(request, "sal_metricas", { columna: "metrica", valor: new URL(request.url).searchParams.get("metrica") });
}
