import type { Metadata } from "next";
import { Desplegable, Etiqueta, Pantalla, Seccion, Tarjeta, Vacio } from "@/components/ui";
import { FilaActiva, TarjetaEsperando, TarjetaPropuesta } from "@/components/aprendizaje/TarjetaRegla";
import { agruparReglas, listarReglas } from "@/lib/datos/reglas";
import { agruparPor, fecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Aprendizaje" };

const ORDEN = ["guionista", "montador", "observador", "archivador", "analista", "coordinador"];

// Lo que los agentes aprenden de ti. Proponen con pruebas (tus correcciones, las estadísticas);
// nada entra sin tu sí, y lo que ya aplican lo puedes quitar con un toque.
export default async function Aprendizaje() {
  const { porDecidir, esperando, activas, historial } = agruparReglas(await listarReglas());
  const porAgente = agruparPor(
    [...activas].sort((a, b) => ORDEN.indexOf(a.agente) - ORDEN.indexOf(b.agente)),
    (r) => r.agente,
  );

  return (
    <Pantalla titulo="Aprendizaje" subtitulo="Lo que los agentes proponen aprender de ti. Nada entra sin tu sí.">
      <Seccion titulo="Por decidir" cuenta={porDecidir.length}>
        {porDecidir.length ? (
          porDecidir.map((r) => <TarjetaPropuesta key={r.id} r={r} />)
        ) : (
          <Vacio titulo="Nada que decidir" texto="Cuando corrijas algo dos veces o las estadísticas enseñen algo claro, aparecerá aquí." />
        )}
      </Seccion>

      {!!esperando.length && (
        <Seccion titulo="Esperando al PC" cuenta={esperando.length}>
          {esperando.map((r) => (
            <TarjetaEsperando key={r.id} r={r} />
          ))}
        </Seccion>
      )}

      <Seccion titulo="Lo que ya aplican" cuenta={activas.length}>
        {activas.length ? (
          porAgente.map((g) => (
            <Tarjeta key={g.etiqueta}>
              <Etiqueta tono="bien">{g.etiqueta}</Etiqueta>
              <div>
                {g.items.map((r) => (
                  <FilaActiva key={r.id} r={r} />
                ))}
              </div>
            </Tarjeta>
          ))
        ) : (
          <Vacio titulo="Todavía ninguna" icono="reloj" tono="neutro" />
        )}
      </Seccion>

      {!!historial.length && (
        <Desplegable titulo={`Rechazadas y quitadas (${historial.length})`}>
          {historial.map((r) => (
            <p key={r.id} className="suave pequeno">
              {r.estado === "rechazada" ? "No" : "Quitada"} · {r.agente} · {r.regla} · {fecha(r.actualizada_en)}
            </p>
          ))}
        </Desplegable>
      )}
    </Pantalla>
  );
}
