// Las prioridades del resumen: el cron guarda frases y el bot Día, objetos con nivel y enlace.
export type Prioridad = { texto: string; nivel?: "urgente" | "importante" | "futuro"; enlace?: string };

const NIVELES = ["urgente", "importante", "futuro"];

export function leerPrioridades(guardadas: unknown): Prioridad[] {
  if (!Array.isArray(guardadas)) return [];
  return guardadas.flatMap((p): Prioridad[] => {
    if (typeof p === "string") return [{ texto: p }];
    if (!p || typeof p !== "object" || typeof (p as Prioridad).texto !== "string") return [];
    const { texto, nivel, enlace } = p as Prioridad;
    return [{ texto, ...(nivel && NIVELES.includes(nivel) ? { nivel } : {}), ...(typeof enlace === "string" && enlaceValido(enlace) ? { enlace } : {}) }];
  });
}

// Una ruta del panel o una web: nada de javascript: ni rutas que salten de dominio.
export function enlaceValido(enlace: string) {
  return /^\/(?!\/)/.test(enlace) || /^https:\/\//.test(enlace);
}

// Lo tachado a mano: { texto: true|false }. Lo que no encaja se ignora.
export function leerMarcas(guardadas: unknown): Record<string, boolean> {
  if (!guardadas || typeof guardadas !== "object" || Array.isArray(guardadas)) return {};
  return Object.fromEntries(Object.entries(guardadas).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>;
}

// Cómo va cada cosa de hoy, para la pantalla y para Antonio: hecha o no, y si la tachó Jordi («a mano») o se resolvió en su página («sola»).
// Lo que Jordi marca a mano manda sobre lo automático, también para destacharlo.
export function estadoCosas(prioridades: Prioridad[], marcas: Record<string, boolean>, abierto: Abierto | undefined) {
  return prioridades.map((p) => {
    const resuelta = resueltaSola(p.enlace, abierto);
    const aMano = marcas[p.texto];
    const hecha = aMano ?? resuelta === true;
    return { ...p, resuelta, hecha, como: !hecha ? null : aMano === true ? ("a mano" as const) : ("sola" as const) };
  });
}

// Lo que todavía te espera en cada módulo. null = no se ha podido leer: entonces no se tacha nada solo.
export type Abierto = { videos: string[] | null; bandeja: number | null; documentos: string[] | null; propuestas?: number | null };

// ¿Está ya resuelta la cosa a la que lleva el enlace? Sirve para tachar sola una cosa de hoy cuando la haces en su página
// (aprobar un montaje, contestar las preguntas, leer la bandeja). null = el panel no lo puede saber: se tacha a mano.
export function resueltaSola(enlace: string | undefined, a: Abierto | undefined): boolean | null {
  if (!enlace || !a) return null;
  const ruta = enlace.split(/[?#]/)[0].replace(/\/$/, "");
  const video = ruta.match(/^\/elsa\/videos\/(GE_\d+)(?:\/guion)?$/);
  if (video) return a.videos ? !a.videos.includes(video[1]) : null;
  if (ruta === "/bandeja") return a.bandeja === null ? null : a.bandeja === 0;
  const doc = ruta.match(/^\/documentos\/([0-9a-f-]{36})$/i);
  if (doc) return a.documentos ? !a.documentos.includes(doc[1]) : null;
  // «Revisa las categorías que te propongo»: hecho cuando no queda ninguna por decidir.
  if (ruta === "/finanzas" && /(^|[?&])ver=propuestas(&|#|$)/.test(enlace.split("?")[1] ?? "")) return a.propuestas == null ? null : a.propuestas === 0;
  return null;
}
