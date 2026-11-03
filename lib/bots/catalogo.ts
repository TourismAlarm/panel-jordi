// Los bots de Grok Bot y lo que puede hacer cada uno.
// Hoy todo entra con la clave de Antonio, que coordina a los demás y dice en cada llamada para quién trabaja (campo `bot`).
// `bot` sirve para ver quién hizo cada cosa, no es seguridad: quien tiene la clave de Antonio puede firmar como cualquiera.
// Las otras dos claves siguen previstas: si un día se crean, esos bots solo pueden firmar como ellos mismos.
export const BOTS = {
  antonio: { nombre: "Antonio", variable: "BOTS_API_KEY_ANTONIO" },
  ideas: { nombre: "Ideas ELSA", variable: "BOTS_API_KEY_IDEAS" },
  guionista: { nombre: "Guionista ELSA", variable: "BOTS_API_KEY_GUIONISTA" },
} as const;

export type Bot = keyof typeof BOTS;
export const IDS_BOTS = Object.keys(BOTS) as Bot[];

export type Permiso =
  | "actividad:escribir"
  | "bandeja:escribir"
  | "bandeja:leer"
  | "ideas:escribir"
  | "ideas:leer"
  | "guiones:escribir"
  | "guiones:leer"
  | "revisiones:escribir"
  | "reglas:leer"
  | "memoria:escribir"
  | "memoria:leer"
  | "videos:leer";

const COMUNES: Permiso[] = ["actividad:escribir", "bandeja:escribir", "bandeja:leer", "reglas:leer", "memoria:escribir", "memoria:leer"];

const PERMISOS: Record<Bot, Permiso[]> = {
  antonio: [...COMUNES, "ideas:leer", "guiones:leer", "revisiones:escribir", "videos:leer"],
  ideas: [...COMUNES, "ideas:escribir", "ideas:leer"],
  guionista: [...COMUNES, "ideas:leer", "guiones:escribir", "guiones:leer"],
};

export function puede(bot: Bot, permiso: Permiso) {
  return PERMISOS[bot].includes(permiso);
}

// Con su clave, Antonio puede hacer lo de cualquiera (dice para quién en `bot`). Los demás, solo lo suyo.
export function clavePuede(clave: Bot, permiso: Permiso) {
  return clave === "antonio" ? IDS_BOTS.some((b) => puede(b, permiso)) : puede(clave, permiso);
}

// Quién firma una llamada. null = esa clave no puede firmar como ese bot, o ese bot no hace eso.
export function resolverAutor(clave: Bot, declarado: Bot | undefined, permiso: Permiso): Bot | null {
  const autor = declarado ?? (clave === "antonio" && !puede("antonio", permiso) ? (IDS_BOTS.find((b) => puede(b, permiso)) ?? clave) : clave);
  if (clave !== "antonio" && autor !== clave) return null;
  return puede(autor, permiso) ? autor : null;
}

export function nombreBot(bot: string | null | undefined) {
  return bot && bot in BOTS ? BOTS[bot as Bot].nombre : bot ?? null;
}

// Llamadas por minuto de cada clave antes de responder 429.
export const LIMITE_POR_MINUTO = 60;
