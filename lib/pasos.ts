// Los pasos de un proyecto, en orden: guion → preguntas → grabar/subir → montaje → revisar → publicar.
// Se calculan con los datos reales (estado, preguntas, fecha, guion), no con el texto «siguiente paso»,
// que a veces se queda viejo. Cada paso dice de quién es y, si es tuyo, qué tocar para hacerlo.

import type { Tono } from "@/components/ui/tono";
import type { ResumenPreguntas } from "@/lib/datos/preguntas";
import type { Proyecto } from "@/lib/datos/videos";
import { faseVideo } from "@/lib/estados";
import { diaCercano, hoy, plural } from "@/lib/formato";

// hecho · tuyo (te toca a ti) · sistema (lo hacen el PC o los agentes) · pendiente (aún no toca)
export type EstadoPaso = "hecho" | "tuyo" | "sistema" | "pendiente";

export type Paso = {
  clave: string;
  titulo: string;
  estado: EstadoPaso;
  detalle?: string;
  accion?: { texto: string; href: string; externo?: boolean };
};

export const TONO_PASO: Record<EstadoPaso, Tono> = { hecho: "bien", tuyo: "ojo", sistema: "info", pendiente: "neutro" };

type Entrada = Pick<Proyecto, "id" | "estado" | "por_revisar" | "fecha_trabajo" | "tieneGuion" | "ficha">;

const SIN_PREGUNTAS: ResumenPreguntas = { total: 0, sinContestar: 0, enviadas: 0 };

// El correo «montaje listo» de este vídeo, buscado en Gmail.
function correoMontaje(id: string) {
  return `https://mail.google.com/mail/#search/${encodeURIComponent(`"montaje listo" ${id}`)}`;
}

export function pasosDe(p: Entrada, q: ResumenPreguntas = SIN_PREGUNTAS): Paso[] {
  const fase = faseVideo(p.estado);
  const yaGrabado = fase === "montaje" || fase === "hecho";
  const pasos: Paso[] = [];

  // 1 · Guion
  if (!p.tieneGuion) {
    pasos.push({ clave: "guion", titulo: "Guion", estado: "sistema", detalle: "Lo está preparando el guionista" });
  } else if (p.ficha.estadoGuion === "borrador" && q.sinContestar) {
    pasos.push({ clave: "guion", titulo: "Guion en borrador", estado: "sistema", detalle: "Se cierra con tus respuestas" });
  } else {
    pasos.push({ clave: "guion", titulo: "Guion listo", estado: "hecho", detalle: p.ficha.version ?? undefined });
  }

  // 2 · Preguntas (solo si el guionista ha preguntado algo)
  if (q.sinContestar) {
    pasos.push({
      clave: "preguntas",
      titulo: `Contestar ${plural(q.sinContestar, "pregunta")}`,
      estado: "tuyo",
      detalle: "Desde aquí mismo",
      accion: { texto: "Contestar", href: `/videos/${p.id}#preguntas` },
    });
  } else if (q.enviadas) {
    pasos.push({ clave: "preguntas", titulo: "Respuestas enviadas", estado: "sistema", detalle: "El PC las recoge en menos de 15 min" });
  } else if (q.total) {
    pasos.push({ clave: "preguntas", titulo: "Preguntas contestadas", estado: "hecho" });
  }

  // 3 · Grabar y subir el material
  const cuando = `${diaCercano(p.fecha_trabajo)}${p.ficha.hora ? ` · ${p.ficha.hora}` : ""}`;
  if (yaGrabado) {
    pasos.push({ clave: "grabar", titulo: "Grabado y subido", estado: "hecho" });
  } else if (p.fecha_trabajo && p.fecha_trabajo < hoy()) {
    pasos.push({
      clave: "subir",
      titulo: `Subir lo grabado (fue ${diaCercano(p.fecha_trabajo).toLowerCase()})`,
      estado: "tuyo",
      detalle: "En el PC: suelta los vídeos en videos/_entrada/ y se reparten solos",
    });
  } else {
    pasos.push({
      clave: "grabar",
      titulo: `Grabar · ${cuando}`,
      estado: "tuyo",
      detalle: p.tieneGuion ? "Antes, mira las notas del guion" : undefined,
      accion: p.tieneGuion ? { texto: "Notas", href: `/videos/${p.id}/guion?ver=notas` } : undefined,
    });
    pasos.push({ clave: "subir", titulo: "Subir lo grabado", estado: "pendiente", detalle: "En el PC: carpeta videos/_entrada/" });
  }

  // 4 · Montaje (lo hacen los agentes)
  if (fase === "hecho" || p.por_revisar || p.estado === "revision_jordi") {
    pasos.push({ clave: "montaje", titulo: "Montaje hecho", estado: "hecho" });
  } else if (fase === "montaje") {
    pasos.push({ clave: "montaje", titulo: "Montando", estado: "sistema", detalle: "Lo hacen los agentes en el PC" });
  } else {
    pasos.push({ clave: "montaje", titulo: "Montaje", estado: "pendiente" });
  }

  // 5 · Revisar el montaje (por correo)
  if (fase === "hecho") {
    pasos.push({ clave: "revisar", titulo: "Montaje revisado", estado: "hecho" });
  } else if (p.por_revisar || p.estado === "revision_jordi") {
    pasos.push({
      clave: "revisar",
      titulo: "Revisar el montaje",
      estado: "tuyo",
      detalle: "Se hace por correo: abre «montaje listo» y contesta en el mismo hilo",
      accion: { texto: "Abrir correo", href: correoMontaje(p.id), externo: true },
    });
  } else {
    pasos.push({ clave: "revisar", titulo: "Revisar el montaje", estado: "pendiente" });
  }

  // 6 · Publicar
  if (/publicado/.test(p.estado)) pasos.push({ clave: "publicar", titulo: "Publicado", estado: "hecho" });
  else if (fase === "hecho") pasos.push({ clave: "publicar", titulo: "Publicar", estado: "sistema", detalle: "Aprobado, falta publicarlo" });
  else pasos.push({ clave: "publicar", titulo: "Publicar", estado: "pendiente" });

  return pasos;
}

// Lo que toca ahora: lo primero que es tuyo; si no hay nada tuyo, lo primero sin hacer.
export function pasoActual(pasos: Paso[]) {
  return pasos.find((x) => x.estado === "tuyo") ?? pasos.find((x) => x.estado !== "hecho") ?? null;
}

export function teToca(pasos: Paso[]) {
  return pasos.some((x) => x.estado === "tuyo");
}
