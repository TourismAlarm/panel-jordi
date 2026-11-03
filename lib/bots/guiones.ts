import { stringify } from "yaml";
import type { Fila } from "@/lib/supabase/tipos";

type Guion = Pick<Fila<"guiones_propuestos">, "titulo" | "gancho" | "planos" | "textos_pantalla" | "preguntas" | "duracion_s" | "tema" | "prueba" | "version">;

const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const enUnaLinea = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v)).replace(/\s*\n\s*/g, " ").trim();

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
  const preguntas = lista(g.preguntas).map((q) => `- ${enUnaLinea(q)}`);

  const guion = [`**Gancho:** ${enUnaLinea(g.gancho)}`];
  if (planos.length) guion.push(`## Planos\n\n${planos.join("\n")}`);
  if (textos.length) guion.push(`## Textos en pantalla\n\n${textos.join("\n")}`);
  if (g.prueba) guion.push(`**Qué prueba:** ${enUnaLinea(g.prueba)}`);

  const partes = [`---\n${cabecera}---`, `# Guion completo\n\n${guion.join("\n\n")}`];
  if (preguntas.length) partes.push(`# Notas para Jordi\n\n${preguntas.join("\n")}`);
  return `${partes.join("\n\n")}\n`;
}

// Un guion se puede reemplazar mientras Jordi no lo haya cerrado. null = se puede; si no, por qué.
export function porQueNoSeReemplaza(previo: Pick<Fila<"guiones_propuestos">, "estado" | "video_id">): string | null {
  if (previo.video_id) return "ese guion ya es un vídeo";
  if (previo.estado !== "propuesto" && previo.estado !== "cambios") return `no se reemplaza un guion ${previo.estado}`;
  return null;
}
