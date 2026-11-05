import { leerSaludBot } from "@/lib/bots/salud-lectura";

// GET /api/bots/salud/registros?desde=&hasta=&limite=&cursor=
export async function GET(request: Request) {
  return leerSaludBot(request, "sal_registros");
}
