import { leerSaludBot } from "@/lib/bots/salud-lectura";

// GET /api/bots/salud/entrenos?desde=&hasta=&limite=&cursor=
export async function GET(request: Request) {
  return leerSaludBot(request, "sal_entrenos");
}
