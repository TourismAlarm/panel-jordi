import "server-only";
import { timingSafeEqual } from "node:crypto";

// Todas las rutas /api/cron/* empiezan por aquí: Vercel manda «Authorization: Bearer <CRON_SECRET>».
// Si CRON_SECRET no está definido se rechaza todo (nunca se deja abierta).
export function cronNoAutorizado(request: Request): Response | null {
  const secreto = process.env.CRON_SECRET;
  const recibido = request.headers.get("authorization") ?? "";
  if (!secreto || secreto.length < 16 || !coincide(recibido, `Bearer ${secreto}`)) {
    return Response.json({ error: "no autorizado" }, { status: 401 });
  }
  return null;
}

function coincide(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
