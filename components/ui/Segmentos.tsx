import Link from "next/link";
import s from "./Segmentos.module.css";

// Selector de vistas en una misma pantalla («Guion · Con indicaciones · Notas»). Cada opción es un enlace.
export function Segmentos({ opciones }: { opciones: { href: string; texto: string; activo: boolean }[] }) {
  return (
    <nav className={s.segmentos}>
      {opciones.map((o) => (
        <Link key={o.href} href={o.href} replace scroll={false} className={s.opcion} aria-current={o.activo ? "page" : undefined}>
          {o.texto}
        </Link>
      ))}
    </nav>
  );
}
