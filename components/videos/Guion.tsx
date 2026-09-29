import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import s from "./Guion.module.css";

// El guion lleva un bloque YAML arriba (datos internos); en el móvil se enseña solo el texto.
function sinFrontmatter(md: string) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

export function Guion({ md }: { md: string }) {
  return (
    <div className={s.guion}>
      <Markdown remarkPlugins={[remarkGfm]}>{sinFrontmatter(md)}</Markdown>
    </div>
  );
}
