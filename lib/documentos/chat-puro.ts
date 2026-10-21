// Piezas puras del chat de documentos (pruebas en chat-puro.test.ts).
export type Fragmento = { n: number; documento_id: string; nombre: string; pagina: number | null; texto: string };

const PARADAS = new Set("de la el los las un una unos unas y o u en a al del con por para que qué cual cuál cuales cómo como cuando cuándo donde dónde quien quién es son ser fue está están hay tiene tengo mi mis mí tu tus su sus se me lo le les ya no sí si pero más muy sobre entre este esta estos estas ese esa eso esto".split(" "));
const sinTildes = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "");

// Palabras con contenido de la pregunta, unidas con OR para la búsqueda (websearch_to_tsquery). Vacío = nada que buscar.
export function consultaDePregunta(pregunta: string): string {
  const palabras = sinTildes(pregunta.toLowerCase())
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !PARADAS.has(p) && !PARADAS.has(sinTildes(p)));
  return [...new Set(palabras)].slice(0, 12).join(" or ");
}

// Solo valen las citas a fragmentos que de verdad se le dieron a la IA (sin duplicados).
export function validarCitas(numeros: number[], fragmentos: Fragmento[]) {
  const vistos = new Set<string>();
  const out: { documento_id: string; nombre: string; pagina: number | null }[] = [];
  for (const n of numeros) {
    const f = fragmentos.find((x) => x.n === n);
    if (!f) continue;
    const clave = `${f.documento_id}|${f.pagina}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    out.push({ documento_id: f.documento_id, nombre: f.nombre.replace(/ \(ficha\)$/, ""), pagina: f.pagina });
  }
  return out;
}
