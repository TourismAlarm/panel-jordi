import { stringify } from "yaml";
import type { Fila } from "@/lib/supabase/tipos";

type Guion = Pick<Fila<"guiones_propuestos">, "titulo" | "gancho" | "planos" | "textos_pantalla" | "preguntas" | "duracion_s" | "tema" | "prueba" | "version">;

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const enUnaLinea = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v)).replace(/\s*\n\s*/g, " ").trim();

// Las preguntas van a la ficha del vídeo para contestarlas; lo demás, a las notas. Misma regla que preguntas_de_guion en Supabase.
export const esPregunta = (texto: string) => /[¿?]/.test(texto);

// Un guion de un bot, en el formato que lee lib/guion.ts: cabecera YAML y secciones «# …».
export function guionAMarkdown(g: Guion): string {
  const cabecera = stringify({
    titulo: g.titulo,
    version: g.version,
    estado: "listo",
    ...(g.tema ? { trabajo: g.tema } : {}),
    ...(g.duracion_s ? { duracion_s: g.duracion_s } : {}),
  });
  const planos = lista(g.planos).map((p, i) => `${i + 1}. ${enUnaLinea(p)}`);
  const textos = (lista(g.textos_pantalla) as { texto?: string; segundo?: number }[]).map((t) => `- Segundo ${t.segundo ?? 0}: «${enUnaLinea(t.texto ?? "")}»`);
  const notas = lista(g.preguntas).map(enUnaLinea).filter((q) => !esPregunta(q)).map((q) => `- ${q}`);

  const guion = [`**Gancho:** ${enUnaLinea(g.gancho)}`];
  if (planos.length) guion.push(`## Planos\n\n${planos.join("\n")}`);
  if (textos.length) guion.push(`## Textos en pantalla\n\n${textos.join("\n")}`);
  if (g.prueba) guion.push(`**Qué prueba:** ${enUnaLinea(g.prueba)}`);

  const partes = [`---\n${cabecera}---`, `# Guion completo\n\n${guion.join("\n\n")}`];
  if (notas.length) partes.push(`# Notas para Jordi\n\n${notas.join("\n")}`);
  return `${partes.join("\n\n")}\n`;
}

// El guion de un vídeo solo se toca si aún no se ha entregado el material (sea del panel o de los que creó el PC). null = se puede; si no, por qué.
export function porQueNoSeEditaElGuion(video: Pick<Fila<"videos">, "origen" | "estado">, materialEntregado: boolean): string | null {
  if (materialEntregado || (video.estado !== "guion_listo_falta_material" && video.estado !== "esperando_material")) return "ese vídeo ya está en montaje: el guion no se toca";
  return null;
}

// Mantiene la cabecera y sube la versión; cambia el cuerpo. null = no hay guion con cabecera que actualizar.
export function guionConCuerpoNuevo(md: string | null, cuerpo: string): { md: string; version: number } | null {
  const m = md?.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!m) return null;
  const v = m[0].match(/^version: *(\d+)/m);
  const version = (v ? Number(v[1]) : 1) + 1;
  const cabecera = v ? m[0].replace(/^version: *\d+/m, `version: ${version}`) : m[0].replace(/\r?\n---\r?\n?$/, `\nversion: ${version}\n---\n`);
  return { md: `${cabecera.trimEnd()}\n\n${cuerpo.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim()}\n`, version };
}

// Un guion se puede reemplazar mientras Jordi no lo haya cerrado. null = se puede; si no, por qué.
export function porQueNoSeReemplaza(previo: Pick<Fila<"guiones_propuestos">, "estado" | "video_id">): string | null {
  if (previo.video_id) return "ese guion ya es un vídeo";
  if (previo.estado !== "propuesto" && previo.estado !== "cambios") return `no se reemplaza un guion ${previo.estado}`;
  return null;
}
