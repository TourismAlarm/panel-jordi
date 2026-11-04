import { NextResponse } from "next/server";

// Lo mínimo del historial para enseñar y deshacer el último cambio de una regla.
export type CambioRegla = { regla_id: string; accion: string; texto_antes: string | null; texto_despues: string | null; quien: string; por_que: string | null; creado: string };

const ACCION: Record<string, string> = { crear: "Añadida", editar: "Cambiada", retirar: "Quitada", reactivar: "Reactivada", deshacer: "Deshecho el último cambio" };
const QUIEN: Record<string, string> = { antonio: "Antonio", jordi: "ti", pc: "el PC" };

export const quienYQue = (c: Pick<CambioRegla, "quien" | "accion">) => `${ACCION[c.accion] ?? c.accion} por ${QUIEN[c.quien] ?? c.quien}`;

// El historial viene del más nuevo al más viejo: se queda con el primero de cada regla.
export function ultimosCambios<T extends Pick<CambioRegla, "regla_id">>(historial: T[]): Map<string, T> {
  const ultimos = new Map<string, T>();
  for (const c of historial) if (!ultimos.has(c.regla_id)) ultimos.set(c.regla_id, c);
  return ultimos;
}

// Mismo criterio que regla_deshacer en Supabase.
export const seDeshace = (c: Pick<CambioRegla, "accion"> | undefined) => !!c && c.accion !== "deshacer";

// P0002 = esa regla no existe. Otro error de regla_* = no se puede hacer (se dice por qué). Lo demás no es culpa del bot.
export function falloDeRegla(error: { code?: string; message: string }): Response {
  if (error.code === "P0002") return NextResponse.json({ error: error.message }, { status: 404 });
  if (error.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
  throw new Error(error.message);
}
