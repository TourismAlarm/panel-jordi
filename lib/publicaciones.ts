// La tarjeta «Para publicar» de Proyectos: lo que ya tiene fecha en alguna red (por fecha) y, al final,
// los vídeos aprobados a los que Antonio aún no les ha puesto fecha en ninguna.

export const NOMBRE_RED = { instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube" } as const;
export type Red = keyof typeof NOMBRE_RED;

type VideoMin = { id: string; titulo: string | null; estado: string };
type PublicacionMin = { video_id: string; red: string; estado: string; fecha: string | null };

export type PorPublicar = { videoId: string; titulo: string; red: Red | null; fecha: string | null };

const APROBADO = /aprobado|exportado|exportacion_pendiente/;
const YA_FUERA = /publicado|metricas|archivado/;

export function paraPublicar(videos: VideoMin[], publicaciones: PublicacionMin[]): PorPublicar[] {
  const porId = new Map(videos.map((v) => [v.id, v]));
  const programados = publicaciones
    .filter((p) => p.estado === "programado" && p.fecha && porId.has(p.video_id))
    .sort((a, b) => new Date(a.fecha!).getTime() - new Date(b.fecha!).getTime() || a.video_id.localeCompare(b.video_id))
    .map((p) => ({ videoId: p.video_id, titulo: porId.get(p.video_id)!.titulo ?? p.video_id, red: p.red as Red, fecha: p.fecha }));

  const conFila = new Set(publicaciones.map((p) => p.video_id));
  const sinFecha = videos
    .filter((v) => APROBADO.test(v.estado) && !YA_FUERA.test(v.estado) && !conFila.has(v.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((v) => ({ videoId: v.id, titulo: v.titulo ?? v.id, red: null, fecha: null }));

  return [...programados, ...sinFecha];
}
