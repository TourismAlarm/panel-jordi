import "server-only";
import { timingSafeEqual } from "node:crypto";

// Para rutas que llaman otros programas (no el navegador): «Authorization: Bearer <secreto>».
// Si el secreto no está definido (o es corto) se rechaza todo: nunca queda abierta.
export function bearerNoAutorizado(request: Request, nombreVariable: string): Response | null {
  const secreto = process.env[nombreVariable]?.trim();
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
