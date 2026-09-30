import type { Metadata } from "next";
import { Pantalla } from "@/components/ui";
import { FormPedirGuion } from "@/components/proyectos/FormPedirGuion";

export const metadata: Metadata = { title: "Pedir guion" };

export default function Nuevo() {
  return (
    <Pantalla
      volver={{ href: "/", texto: "Proyectos" }}
      titulo="Pedir guion"
      subtitulo="Para un trabajo que no está en la lista. El PC se lo pasa al guionista."
      accion={false}
    >
      <FormPedirGuion />
    </Pantalla>
  );
}
