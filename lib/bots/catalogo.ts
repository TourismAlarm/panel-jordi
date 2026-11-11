// Los bots de Grok Bot y lo que puede hacer cada uno.
// Hoy todo entra con la clave de Antonio, que coordina a los demás y dice en cada llamada para quién trabaja (campo `bot`).
// `bot` sirve para ver quién hizo cada cosa, no es seguridad: quien tiene la clave de Antonio puede firmar como cualquiera.
// Las otras dos claves siguen previstas: si un día se crean, esos bots solo pueden firmar como ellos mismos.
export const BOTS = {
  antonio: { nombre: "Antonio", variable: "BOTS_API_KEY_ANTONIO" },
  ideas: { nombre: "Ideas ELSA", variable: "BOTS_API_KEY_IDEAS" },
  guionista: { nombre: "Guionista ELSA", variable: "BOTS_API_KEY_GUIONISTA" },
  editor: { nombre: "Editor (PC)", variable: "BOTS_API_KEY_EDITOR" },
  dia: { nombre: "Día a día", variable: "BOTS_API_KEY_DIA" },
  finanzas: { nombre: "Finanzas", variable: "BOTS_API_KEY_FINANZAS" },
  salud: { nombre: "Salud", variable: "BOTS_API_KEY_SALUD" },
  documentos: { nombre: "Documentos", variable: "BOTS_API_KEY_DOCUMENTOS" },
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
  | "reglas:escribir"
  | "edicion:escribir"
  | "edicion:leer"
  | "edicion:tomar"
  | "edicion:informar"
  | "edicion:entregar" // montaje hecho fuera de la cola: Antonio o el Editor
  | "edicion:cerrar"
  | "memoria:escribir"
  | "memoria:leer"
  | "videos:leer"
  | "peticiones:leer"
  | "peticiones:escribir"
  | "redes:leer"
  | "redes:escribir"
  | "publicaciones:leer"
  | "publicaciones:escribir" // cuándo sale cada vídeo en cada red: tarjeta «Para publicar»
  | "hoy:leer"
  | "hoy:escribir"
  | "finanzas:resumen" // lo único de dinero que lee Día
  | "finanzas:leer"
  | "finanzas:informe"
  | "finanzas:proponer" // propone categorías; quien las aplica es Jordi
  | "finanzas:aconsejar" // avisos y consejos de asesor: «Lo que ve Antonio» en Finanzas
  | "salud:leer"
  | "salud:escribir" // lo que lee de Garmin: solo métricas y entrenos
  | "salud:informe"
  | "documentos:vencimientos" // lo único de documentos que lee Día: sin texto
  | "documentos:leer"
  | "documentos:ficha"
  | "arnes:leer" // el arnés (/api/bots/arnes): solo Antonio lo escribe y lo lee
  | "arnes:escribir";

const COMUNES: Permiso[] = ["actividad:escribir", "bandeja:escribir", "bandeja:leer", "reglas:leer", "memoria:escribir", "memoria:leer"];

const PERMISOS: Record<Bot, Permiso[]> = {
  antonio: [...COMUNES, "ideas:leer", "guiones:leer", "revisiones:escribir", "reglas:escribir", "edicion:escribir", "edicion:leer", "videos:leer", "peticiones:leer", "peticiones:escribir", "redes:leer", "redes:escribir", "publicaciones:leer", "publicaciones:escribir", "arnes:leer", "arnes:escribir", "edicion:entregar", "edicion:cerrar"],
  ideas: [...COMUNES, "ideas:escribir", "ideas:leer"],
  guionista: [...COMUNES, "ideas:leer", "guiones:escribir", "guiones:leer"],
  editor: ["edicion:tomar", "edicion:informar", "edicion:entregar", "reglas:leer"],
  dia: [...COMUNES, "hoy:leer", "hoy:escribir", "videos:leer", "documentos:vencimientos", "finanzas:resumen"],
  finanzas: [...COMUNES, "finanzas:resumen", "finanzas:leer", "finanzas:informe", "finanzas:proponer", "finanzas:aconsejar"],
  salud: [...COMUNES.filter((p) => p !== "memoria:escribir"), "salud:leer", "salud:escribir", "salud:informe"],
  documentos: [...COMUNES, "documentos:vencimientos", "documentos:leer", "documentos:ficha"],
};

// Dónde deja sus avisos cada bot en la Bandeja: lo de Salud nunca cae en ELSA.
const MODULO_BANDEJA: Partial<Record<Bot, "hoy" | "finanzas" | "salud" | "documentos">> = { dia: "hoy", finanzas: "finanzas", salud: "salud", documentos: "documentos" };
export function moduloDeBot(bot: Bot) {
  return MODULO_BANDEJA[bot] ?? ("elsa" as const);
}

export function puede(bot: Bot, permiso: Permiso) {
  return PERMISOS[bot].includes(permiso);
}

// Lo que solo hace el PC con su clave: Antonio no toma encargos ni los da por hechos.
const SOLO_SU_CLAVE: Permiso[] = ["edicion:tomar", "edicion:informar"];

// Con su clave, Antonio puede hacer lo de cualquiera (dice para quién en `bot`). Los demás, solo lo suyo.
export function clavePuede(clave: Bot, permiso: Permiso) {
  return clave === "antonio" && !SOLO_SU_CLAVE.includes(permiso) ? IDS_BOTS.some((b) => puede(b, permiso)) : puede(clave, permiso);
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
