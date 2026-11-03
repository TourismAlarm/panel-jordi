import type { Metadata } from "next";
import { TarjetaIdea } from "@/components/bots/TarjetaIdea";
import { Pantalla, Segmentos, Vacio } from "@/components/ui";
import { listarIdeas } from "@/lib/datos/bots";

export const metadata: Metadata = { title: "Ideas" };

const VISTAS = [
  { id: "nueva", texto: "Por decidir" },
  { id: "me_gusta", texto: "Me gustan" },
  { id: "usada", texto: "Con guion" },
  { id: "descartada", texto: "Descartadas" },
];

// Las ideas de los bots. «Me gusta» las deja listas para el Guionista ELSA.
export default async function Ideas({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver } = await searchParams;
  const vista = VISTAS.find((v) => v.id === ver)?.id ?? "nueva";
  const ideas = await listarIdeas();
  const cuenta = (id: string) => ideas.filter((i) => i.estado === id).length;
  const vistas = ideas.filter((i) => i.estado === vista);

  return (
    <Pantalla titulo="Ideas" subtitulo="Lo que traen los bots. Lo que te guste pasa al Guionista.">
      <Segmentos
        opciones={VISTAS.map((v) => ({
          href: v.id === "nueva" ? "/elsa/ideas" : `/elsa/ideas?ver=${v.id}`,
          texto: `${v.texto} (${cuenta(v.id)})`,
          activo: v.id === vista,
        }))}
      />
      {vistas.length === 0 ? <Vacio icono="bombilla" tono="neutro" titulo="Nada por aquí" /> : vistas.map((i) => <TarjetaIdea key={i.id} idea={i} />)}
    </Pantalla>
  );
}
