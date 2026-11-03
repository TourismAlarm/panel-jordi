import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BOTS, clavePuede, IDS_BOTS, LIMITE_POR_MINUTO, resolverAutor, type Bot, type Permiso } from "./catalogo";
import { IdBot } from "./esquemas";
import { revisarDatos } from "./limpieza";

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
  } else if (!clavePuede(bot, permiso)) {
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

// Quién firma la llamada (campo `bot`). Si no puede firmar como ese bot o ese bot no hace esto: 403.
export function firmante(clave: Bot, declarado: Bot | undefined, permiso: Permiso): { autor: Bot } | { fallo: Response } {
  const autor = resolverAutor(clave, declarado, permiso);
  return autor ? { autor } : { fallo: NextResponse.json({ error: "este bot no puede hacer esto" }, { status: 403 }) };
}

// Lo mismo para un GET: ?bot=ideas.
export function firmanteDeUrl(request: Request, clave: Bot, permiso: Permiso): { autor: Bot } | { fallo: Response } {
  const pedido = new URL(request.url).searchParams.get("bot");
  if (pedido === null) return firmante(clave, undefined, permiso);
  const bot = IdBot.safeParse(pedido);
  return bot.success ? firmante(clave, bot.data, permiso) : { fallo: NextResponse.json({ error: "bot no válido" }, { status: 400 }) };
}

// Sin datos de clientes en ideas, guiones ni memoria: si hay, se rechaza y se dice dónde. No se guarda nada.
export function conDatosDeCliente(datos: unknown): Response | null {
  const hallados = revisarDatos(datos);
  if (!hallados.length) return null;
  return NextResponse.json({ error: "lleva datos de clientes", detalle: hallados.map((h) => `${h.campo}: ${h.datos.join(", ")}`) }, { status: 422 });
}

// Filtro opcional de la url (?estado=…). Sin él, null. Si no vale, la respuesta 400.
export function leerFiltro<T extends z.ZodType>(request: Request, nombre: string, esquema: T): { valor: z.output<T> | null } | { fallo: Response } {
  const crudo = new URL(request.url).searchParams.get(nombre);
  if (crudo === null) return { valor: null };
  const parsed = esquema.safeParse(crudo);
  return parsed.success ? { valor: parsed.data } : { fallo: NextResponse.json({ error: `${nombre} no válido` }, { status: 400 }) };
}
