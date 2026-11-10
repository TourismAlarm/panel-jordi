import { NextResponse } from "next/server";
import { bearerNoAutorizado } from "@/lib/bearer-auth";
import { guardarIngesta } from "@/lib/salud/guardar-ingesta";
import { CuerpoIngesta } from "@/lib/salud/ingesta";

export const maxDuration = 60;

// POST /api/salud/ingesta — el proceso del PC deja aquí los datos de salud (reloj, pesas…).
// Protegida con SALUD_INGESTA_SECRET. Repetir el envío no duplica: se sobrescribe por día+métrica+fuente.
export async function POST(request: Request) {
  const denegado = bearerNoAutorizado(request, "SALUD_INGESTA_SECRET");
  if (denegado) return denegado;

  const parsed = CuerpoIngesta.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "datos no válidos", detalle: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await guardarIngesta(parsed.data)) });
  } catch (e) {
    // El detalle se queda en el log: hacia fuera no salen mensajes de la base de datos.
    console.error("Salud · ingesta:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "no se pudo guardar" }, { status: 500 });
  }
}
