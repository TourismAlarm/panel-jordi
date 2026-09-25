"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/", texto: "Inicio" },
  { href: "/videos", texto: "Vídeos" },
  { href: "/actividad", texto: "Actividad" },
];

export default function Nav() {
  const ruta = usePathname();
  if (ruta.startsWith("/login")) return null;
  return (
    <nav className="nav">
      {enlaces.map((e) => {
        const activo = e.href === "/" ? ruta === "/" : ruta.startsWith(e.href);
        return (
          <Link key={e.href} href={e.href} className={activo ? "activo" : ""}>
            {e.texto}
          </Link>
        );
      })}
    </nav>
  );
}
