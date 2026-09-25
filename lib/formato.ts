// Estado del vídeo -> texto legible y color del badge.
export function estadoTexto(estado: string) {
  const t = estado.replaceAll("_", " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function estadoClase(estado: string) {
  if (/publicado|aprobado|exportado/.test(estado)) return "b-ok";
  if (/archivado|sin_estado/.test(estado)) return "b-gris";
  if (/revision/.test(estado)) return "b-acento";
  if (/respuestas|pregunt/.test(estado)) return "b-espera";
  if (/material|grab/.test(estado)) return "b-azul";
  return "b-gris";
}

export const CERRADOS = /publicado|aprobado|exportado|archivado/;

// Estado en palabras de Jordi, como en el panel del ordenador. tono: bien | ojo | info | neutro
export function estadoCorto(estado: string): { texto: string; tono: "bien" | "ojo" | "info" | "neutro" } {
  if (estado === "revision_jordi") return { texto: "Te toca revisar", tono: "ojo" };
  if (/respuestas|pregunt/.test(estado)) return { texto: "Faltan tus respuestas", tono: "ojo" };
  if (/guion_listo/.test(estado) && /material/.test(estado)) return { texto: "Guion listo · falta grabar", tono: "info" };
  if (/material|grab/.test(estado)) return { texto: "Falta grabar", tono: "neutro" };
  if (/publicado/.test(estado)) return { texto: "Publicado", tono: "bien" };
  if (/aprobado|exportado/.test(estado)) return { texto: "Aprobado", tono: "bien" };
  if (/archivado/.test(estado)) return { texto: "Archivado", tono: "neutro" };
  if (/mont|observ|archiv|invent|render/.test(estado)) return { texto: "Montando", tono: "info" };
  return { texto: estadoTexto(estado), tono: "neutro" };
}

export function dia(fechaISO: string | null) {
  if (!fechaISO) return "";
  return new Intl.DateTimeFormat("es-ES", { timeZone: zona, weekday: "short", day: "numeric", month: "short" })
    .format(new Date(`${fechaISO}T12:00:00Z`))
    .replace(".", "");
}

const zona = "Europe/Madrid";

export function haceCuanto(iso: string | null) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "ahora mismo";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return fecha(iso);
}

export function fecha(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: zona,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function resultadoClase(r: string | null) {
  if (r === "ok") return "r-ok";
  if (r === "fallo" || r === "error" || r === "bloqueado") return "r-mal";
  if (r === "correccion") return "r-espera";
  return "r-gris";
}
