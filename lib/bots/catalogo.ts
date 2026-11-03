// Los bots de Grok Bot y lo que puede hacer cada uno. Una clave por bot: se sabe quién escribe y se puede revocar una sola.
export const BOTS = {
  antonio: { nombre: "Antonio", variable: "BOTS_API_KEY_ANTONIO" },
  ideas: { nombre: "Ideas ELSA", variable: "BOTS_API_KEY_IDEAS" },
  guionista: { nombre: "Guionista ELSA", variable: "BOTS_API_KEY_GUIONISTA" },
} as const;

export type Bot = keyof typeof BOTS;
export const IDS_BOTS = Object.keys(BOTS) as Bot[];

export type Permiso = "actividad:escribir" | "bandeja:escribir" | "bandeja:leer";

const PERMISOS: Record<Bot, Permiso[]> = {
  antonio: ["actividad:escribir", "bandeja:escribir", "bandeja:leer"],
  ideas: ["actividad:escribir", "bandeja:escribir", "bandeja:leer"],
  guionista: ["actividad:escribir", "bandeja:escribir", "bandeja:leer"],
};

export function puede(bot: Bot, permiso: Permiso) {
  return PERMISOS[bot].includes(permiso);
}

export function nombreBot(bot: string | null | undefined) {
  return bot && bot in BOTS ? BOTS[bot as Bot].nombre : bot ?? null;
}

// Llamadas por minuto de cada bot antes de responder 429.
export const LIMITE_POR_MINUTO = 60;
