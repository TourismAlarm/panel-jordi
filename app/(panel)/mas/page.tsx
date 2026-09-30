import type { Metadata } from "next";
import { Boton, Etiqueta, Fila, Icono, Lista, Pantalla, Seccion } from "@/components/ui";
import { salir } from "@/lib/acciones";
import { usuarioActual } from "@/lib/datos/sesion";
import { estadoSync } from "@/lib/datos/sync";

export const metadata: Metadata = { title: "Más" };

export default async function Mas() {
  const [{ email }, sync] = await Promise.all([usuarioActual(), estadoSync()]);

  return (
    <Pantalla titulo="Más" accion={false}>
      <Seccion titulo="Sincronización">
        <Lista>
          <Fila
            inicio={<Icono nombre="reloj" />}
            titulo="Estado del PC"
            detalle={<Etiqueta tono={sync.tono}>{sync.texto}</Etiqueta>}
          />
        </Lista>
        <p className="suave pequeno">
          El PC sube vídeos, guiones y actividad y recoge tus respuestas cada pocos minutos. Desde aquí solo se escriben tus
          respuestas.
        </p>
      </Seccion>

      <Seccion titulo="La app">
        <Lista>
          <Fila href="/piezas" inicio={<Icono nombre="piezas" />} titulo="Piezas de la app" detalle="Todas las piezas de la base, a la vista" />
        </Lista>
      </Seccion>

      <Seccion titulo="Cuenta">
        <Lista>
          <Fila titulo={email ?? "Sesión iniciada"} detalle="Has entrado con esta cuenta" />
        </Lista>
        <form action={salir}>
          <Boton variante="peligro">
            <Icono nombre="salir" tamano={20} />
            Salir
          </Boton>
        </form>
      </Seccion>
    </Pantalla>
  );
}
