import type { Metadata } from "next";
import { Pantalla, Seccion } from "@/components/ui";
import { ListaAgentes } from "@/components/actividad/ListaAgentes";
import { Registro } from "@/components/actividad/Registro";
import { actividadReciente, estadoAgentes } from "@/lib/datos/actividad";

export const metadata: Metadata = { title: "Actividad" };

export default async function Actividad() {
  const [filas, { agentes }] = await Promise.all([actividadReciente(), estadoAgentes()]);

  return (
    <Pantalla titulo="Actividad" subtitulo="Lo que han hecho los agentes, lo último arriba.">
      <Seccion titulo="Agentes">
        <ListaAgentes agentes={agentes} />
      </Seccion>
      <Seccion titulo="Registro">
        <Registro filas={filas} conVideo />
      </Seccion>
    </Pantalla>
  );
}
