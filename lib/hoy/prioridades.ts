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

// Lo tachado a mano, tal como se guarda en la fila del día: { clave: true|false }. Lo que no encaja se ignora.
// Las filas anteriores a las claves guardaban el texto tal cual: marcasPorClave las traduce.
export function leerMarcas(guardadas: unknown): Record<string, boolean> {
  if (!guardadas || typeof guardadas !== "object" || Array.isArray(guardadas)) return {};
  return Object.fromEntries(Object.entries(guardadas).filter(([, v]) => typeof v === "boolean")) as Record<string, boolean>;
}

// Cuántos días después sigue valiendo lo tachado a mano: si vuelve la misma cosa, sale ya hecha.
export const DIAS_TACHADO = 14;

// El título sin mayúsculas, tildes, signos ni espacios de más: «¡Llamar al gestor!» y «llamar al  gestor» son la misma cosa.
export function normalizarTitulo(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// La clave estable de una cosa de hoy: el enlace si lo hay; si no, el título normalizado.
// Con ella lo tachado sobrevive a otro resumen del mismo día y a la misma cosa al día siguiente.
export function claveCosa(p: { texto: string; enlace?: string }): string {
  if (p.enlace) return p.enlace.trim();
  return `texto:${normalizarTitulo(p.texto) || p.texto.trim()}`;
}

// Las marcas de un día por clave. Las antiguas (con el texto tal cual) se traducen con las prioridades de ese día; si hay
// las dos para la misma cosa, manda la de clave.
export function marcasPorClave(guardadas: unknown, prioridades: Prioridad[]): Record<string, boolean> {
  const marcas = leerMarcas(guardadas);
  const claves = new Set(prioridades.map(claveCosa));
  const porTexto = new Map(prioridades.map((p) => [p.texto, claveCosa(p)]));
  const antiguas: Record<string, boolean> = {};
  const nuevas: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(marcas)) {
    const traducida = claves.has(k) ? undefined : porTexto.get(k);
    if (traducida !== undefined) antiguas[traducida] = v;
    else nuevas[k] = v;
  }
  return { ...antiguas, ...nuevas };
}

// Lo tachado a mano en días anteriores: clave → día en que se tachó. Manda la última decisión de Jordi:
// si después la destachó, no se arrastra. Quien llama pasa solo los días de la ventana (los DIAS_TACHADO anteriores).
export function tachadasDe(dias: { fecha: string; prioridades: unknown; marcas: unknown }[]): Record<string, string> {
  const ultima = new Map<string, { fecha: string; hecha: boolean }>();
  for (const d of [...dias].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const [clave, hecha] of Object.entries(marcasPorClave(d.marcas, leerPrioridades(d.prioridades)))) ultima.set(clave, { fecha: d.fecha, hecha });
  }
  return Object.fromEntries([...ultima].filter(([, x]) => x.hecha).map(([clave, x]) => [clave, x.fecha]));
}

// Cómo va cada cosa del día, para la pantalla y para Antonio: hecha o no, y si la tachó Jordi («a mano», con el día en
// `hecha_el`) o se resolvió en su página («sola»). Lo que Jordi marca a mano ese día manda sobre todo, también para destacharlo;
// si ese día no la ha tocado, vale lo que tachó en los días anteriores (`tachadas`), y si no, lo automático.
export function estadoCosas(prioridades: Prioridad[], marcas: unknown, abierto: Abierto | undefined, dia: { fecha?: string; tachadas?: Record<string, string> } = {}) {
  const delDia = marcasPorClave(marcas, prioridades);
  return prioridades.map((p) => {
    const clave = claveCosa(p);
    const resuelta = resueltaSola(p.enlace, abierto);
    const hoy = delDia[clave];
    const antes = hoy === undefined ? dia.tachadas?.[clave] : undefined;
    const aMano = hoy ?? (antes ? true : undefined);
    const hecha = aMano ?? resuelta === true;
    const como = !hecha ? null : aMano === true ? ("a mano" as const) : ("sola" as const);
    const hecha_el = como !== "a mano" ? null : hoy === true ? (dia.fecha ?? null) : (antes ?? null);
    return { ...p, clave, resuelta, hecha, como, hecha_el };
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
