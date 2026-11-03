import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BOTS, IDS_BOTS, LIMITE_POR_MINUTO, puede, type Bot, type Permiso } from "./catalogo";

function identificar(request: Request): Bot | null {
  return IDS_BOTS.find((b) => bearerNoAutorizado(request, BOTS[b].variable) === null) ?? null;
}

// Puerta común de /api/bots/*: clave, permiso del bot, límite por minuto y log de la llamada.
// Las llamadas sin clave válida no se apuntan: nadie de fuera puede llenar el log.
export async function conBot(request: Request, permiso: Permiso, trabajo: (bot: Bot) => Promise<Response>): Promise<Response> {
  const bot = identificar(request);
  if (!bot) return NextResponse.json({ error: "no autorizado" }, { status: 401 });

  const db = supabaseAdmin();
  const hace1Min = new Date(Date.now() - 60_000).toISOString();
  const { count, error } = await db.from("bots_llamadas").select("id", { count: "exact", head: true }).eq("bot", bot).gte("creado", hace1Min);

  let respuesta: Response;
  if (error) {
    console.error("Bots · límite:", error.message);
    respuesta = NextResponse.json({ error: "no disponible" }, { status: 503 });
  } else if ((count ?? 0) >= LIMITE_POR_MINUTO) {
    respuesta = NextResponse.json({ error: "demasiadas llamadas" }, { status: 429, headers: { "Retry-After": "60" } });
  } else if (!puede(bot, permiso)) {
    respuesta = NextResponse.json({ error: "este bot no tiene permiso" }, { status: 403 });
  } else {
    try {
      respuesta = await trabajo(bot);
    } catch (e) {
      console.error("Bots · trabajo:", e);
      respuesta = NextResponse.json({ error: "error interno" }, { status: 500 });
    }
  }

  const { error: eLog } = await db.from("bots_llamadas").insert({ bot, metodo: request.method, ruta: new URL(request.url).pathname, estado: respuesta.status });
  if (eLog) console.error("Bots · log:", eLog.message);
  return respuesta;
}

// Lee y valida el cuerpo JSON. Devuelve los datos o la respuesta 400 con qué falla.
export async function leerCuerpo<T extends z.ZodType>(request: Request, esquema: T): Promise<{ datos: z.output<T> } | { fallo: Response }> {
  const parsed = esquema.safeParse(await request.json().catch(() => null));
  if (parsed.success) return { datos: parsed.data };
  const detalle = parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`);
  return { fallo: NextResponse.json({ error: "datos no válidos", detalle }, { status: 400 }) };
}
