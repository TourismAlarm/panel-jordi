"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "@/components/ui";
import s from "./BarraPestanas.module.css";

// Las secciones de la app. Para añadir una: una línea aquí y su carpeta en app/(panel)/.
// «tambien»: otras rutas que cuelgan de esa pestaña aunque no empiecen por su dirección.
const PESTANAS: { href: string; texto: string; icono: NombreIcono; tambien?: string[] }[] = [
  { href: "/", texto: "Inicio", icono: "inicio" },
  { href: "/videos", texto: "Vídeos", icono: "videos" },
  { href: "/actividad", texto: "Actividad", icono: "actividad" },
  { href: "/mas", texto: "Más", icono: "mas", tambien: ["/piezas"] },
];

export function BarraPestanas() {
  const ruta = usePathname();
  return (
    <nav className={s.barra} aria-label="Secciones">
      {PESTANAS.map((p) => {
        const activa =
          p.href === "/" ? ruta === "/" : [p.href, ...(p.tambien ?? [])].some((r) => ruta.startsWith(r));
        return (
          <Link key={p.href} href={p.href} className={s.pestana} aria-current={activa ? "page" : undefined}>
            <Icono nombre={p.icono} tamano={24} />
            <span>{p.texto}</span>
          </Link>
        );
      })}
    </nav>
  );
}
