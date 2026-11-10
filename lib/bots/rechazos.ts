// Llamadas de bots que el panel rechazó: qué se apunta de cada una y cómo se resumen. Sin base de datos.

// El motivo que se le devolvió al bot, en una línea: «datos no válidos · items.0.categoria: …». Sin motivo, null.
export function detalleDeRechazo(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object") return null;
  const { error, detalle } = cuerpo as { error?: unknown; detalle?: unknown };
  const partes = [typeof error === "string" ? error : null, ...(Array.isArray(detalle) ? detalle.filter((d): d is string => typeof d === "string") : [])].filter(Boolean);
  return partes.length ? partes.join(" · ").slice(0, 500) : null;
}

export type Llamada = { metodo: string; ruta: string; estado: number; detalle: string | null; creado: string };
export type Rechazo = { metodo: string; ruta: string; estado: number; por_que: string | null; veces: number; ultima: string };

// Los ids de la ruta se quitan para que el mismo error en dos vídeos cuente como uno.
const sinIds = (ruta: string) => ruta.replace(/\/[0-9a-f]{8}-[0-9a-f-]{27}(?=\/|$)/gi, "/{id}").replace(/\/GE_\d+(?=\/|$)/g, "/{video}");

// Agrupa los rechazos iguales: lo que más se repite, primero. El 429 (ir demasiado rápido) no es un error de contenido y no cuenta.
export function agruparRechazos(llamadas: Llamada[], max = 15): Rechazo[] {
  const grupos = new Map<string, Rechazo>();
  for (const l of llamadas) {
    if (l.estado < 400 || l.estado === 429) continue;
    const ruta = sinIds(l.ruta);
    const clave = `${l.metodo} ${ruta} ${l.estado} ${l.detalle ?? ""}`;
    const g = grupos.get(clave);
    if (g) {
      g.veces++;
      if (l.creado > g.ultima) g.ultima = l.creado;
    } else grupos.set(clave, { metodo: l.metodo, ruta, estado: l.estado, por_que: l.detalle, veces: 1, ultima: l.creado });
  }
  return [...grupos.values()].sort((a, b) => b.veces - a.veces || b.ultima.localeCompare(a.ultima)).slice(0, max);
}
