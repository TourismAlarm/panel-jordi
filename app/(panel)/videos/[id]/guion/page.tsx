import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pantalla, Segmentos, Tarjeta } from "@/components/ui";
import { Guion } from "@/components/videos/Guion";
import { obtenerVideo } from "@/lib/datos/videos";
import { buscarSeccion, SECCION, seccionesDeGuion } from "@/lib/guion";

export const metadata: Metadata = { title: "Guion" };

const VISTAS = [
  { ver: "lectura", texto: "Guion", seccion: SECCION.lectura },
  { ver: "indicaciones", texto: "Con indicaciones", seccion: SECCION.indicaciones },
  { ver: "notas", texto: "Notas", seccion: SECCION.notas },
] as const;

// Modo lectura: el guion a pantalla completa y con letra grande. Por defecto, solo lo que se dice.
export default async function LeerGuion({ params, searchParams }: PageProps<"/videos/[id]/guion">) {
  const [{ id }, { ver }] = await Promise.all([params, searchParams]);
  const video = await obtenerVideo(id);
  if (!video) notFound();

  const secciones = seccionesDeGuion(video.guion_md);
  const vistas = VISTAS.map((v) => ({ ...v, contenido: buscarSeccion(secciones, v.seccion) })).filter((v) => v.contenido);
  const actual = vistas.find((v) => v.ver === ver) ?? vistas[0];

  return (
    <Pantalla volver={{ href: `/videos/${id}`, texto: "Ficha" }} antetitulo={id} titulo={video.titulo ?? id} accion={false}>
      {vistas.length > 1 && (
        <Segmentos
          opciones={vistas.map((v) => ({ href: `/videos/${id}/guion?ver=${v.ver}`, texto: v.texto, activo: v === actual }))}
        />
      )}

      {!video.guion_md ? (
        <Tarjeta>
          <span className="suave">Todavía no hay guion.</span>
        </Tarjeta>
      ) : (
        <Tarjeta>
          {/* Si el guion no trae las secciones de siempre, se enseña entero */}
          <Guion md={actual?.contenido?.md ?? video.guion_md} lectura />
        </Tarjeta>
      )}
    </Pantalla>
  );
}
