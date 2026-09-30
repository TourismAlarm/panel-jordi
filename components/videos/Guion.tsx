import type { ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import s from "./Guion.module.css";

// El guion lleva un bloque YAML arriba (datos internos); en el móvil se enseña solo el texto.
function sinFrontmatter(md: string) {
  return md.replace(/^---\n[\s\S]*?\n---\n/, "");
}

function texto(n: ReactNode): string {
  if (typeof n === "string" || typeof n === "number") return String(n);
  if (Array.isArray(n)) return n.map(texto).join("");
  return "";
}

// «**A CÁMARA · GANCHO**» o «**VOZ EN OFF**» → etiqueta de bloque con color: se ve de un vistazo quién habla.
function tipoDeBloque(t: string) {
  if (/^A C[ÁA]MARA/i.test(t)) return "camara";
  if (/VOZ EN OFF/i.test(t)) return "voz";
  if (/^(CIERRE|R[ÓO]TULO|PLANO)/i.test(t)) return "otro";
  return null;
}

function Negrita({ children }: { children?: ReactNode }) {
  const tipo = tipoDeBloque(texto(children));
  if (!tipo) return <strong>{children}</strong>;
  return (
    <strong className={s.bloque} data-tipo={tipo}>
      {children}
    </strong>
  );
}

// lectura: letra más grande y más aire, para leerlo en voz alta o antes de grabar.
export function Guion({ md, lectura = false }: { md: string; lectura?: boolean }) {
  return (
    <div className={`${s.guion} ${lectura ? s.lectura : ""}`}>
      <Markdown remarkPlugins={[remarkGfm]} components={{ strong: Negrita }}>
        {sinFrontmatter(md)}
      </Markdown>
    </div>
  );
}
