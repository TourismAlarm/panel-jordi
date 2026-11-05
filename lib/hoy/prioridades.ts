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
