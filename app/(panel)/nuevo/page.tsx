import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pantalla, Segmentos } from "@/components/ui";
import { FormEdicionSinGuion } from "@/components/proyectos/FormEdicionSinGuion";
import { FormPedirGuion } from "@/components/proyectos/FormPedirGuion";
import { PETICIONES_ACTIVAS } from "@/lib/funciones";
import { hoy } from "@/lib/formato";

export const metadata: Metadata = { title: "Nuevo proyecto" };

// Un trabajo que no está en la lista: pedir guion (aún no se ha hecho) o «ya lo he grabado» (urgencia sin guion).
export default async function Nuevo({ searchParams }: PageProps<"/nuevo">) {
  if (!PETICIONES_ACTIVAS) notFound();
  const { que } = await searchParams;
  const grabado = que === "grabado";
  return (
    <Pantalla
      volver={{ href: "/", texto: "Proyectos" }}
      titulo="Nuevo proyecto"
      subtitulo={
        grabado
          ? "Para una urgencia que ya has grabado sin guion. Se edita con lo que hay."
          : "Para un trabajo que no está en la lista. El PC se lo pasa al guionista."
      }
      accion={false}
    >
      <Segmentos
        opciones={[
          { href: "/nuevo", texto: "Pedir guion", activo: !grabado },
          { href: "/nuevo?que=grabado", texto: "Ya lo he grabado", activo: grabado },
        ]}
      />
      {grabado ? <FormEdicionSinGuion hoy={hoy()} /> : <FormPedirGuion />}
    </Pantalla>
  );
}
