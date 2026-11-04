import type { z } from "zod";
import type { EncargoIn } from "./esquemas";

// Lógica pura de la cola de edición (pruebas en edicion.test.ts).
export type PreguntaEncargo = { texto: string; respuesta: string | null };

// Lo que se mira en busca de datos de clientes. Los nombres de archivo y los tiempos no: sus números no son de nadie.
export function textosDeEncargo({ instrucciones, feedback, guion_md, brutos }: z.output<typeof EncargoIn>) {
  const { cortes, ...resto } = instrucciones;
  return { ...resto, notas_cortes: cortes.map((c) => c.nota ?? ""), feedback, guion_md, brutos };
}

export const preguntasNuevas = (textos: string[]): PreguntaEncargo[] => textos.map((texto) => ({ texto, respuesta: null }));

// Mete las respuestas. null = falta alguna o una no existe: el PC seguiría sin poder seguir.
export function conRespuestas(preguntas: PreguntaEncargo[], respuestas: { n: number; respuesta: string }[]): PreguntaEncargo[] | null {
  if (respuestas.some((r) => r.n > preguntas.length)) return null;
  const nuevas = preguntas.map((p, i) => ({ ...p, respuesta: respuestas.find((r) => r.n === i + 1)?.respuesta ?? p.respuesta }));
  return nuevas.every((p) => p.respuesta) ? nuevas : null;
}

// Qué se apunta en Actividad → Bots según lo que informa el PC.
export const RESULTADO_ACTIVIDAD = { listo: "ok", bloqueado: "nada", fallido: "fallo" } as const;
