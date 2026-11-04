import type { Metadata } from "next";
import { Desplegable, Etiqueta, Pantalla, Seccion, Tarjeta, Vacio } from "@/components/ui";
import { FilaActiva, TarjetaPropuesta, UltimoCambio } from "@/components/aprendizaje/TarjetaRegla";
import { ultimosCambios } from "@/lib/bots/reglas";
import { agruparReglas, listarCambiosDeReglas, listarReglas } from "@/lib/datos/reglas";
import { agruparPor, fecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Aprendizaje" };

const ORDEN = ["guionista", "ideas", "montador", "observador", "archivador", "analista", "antonio", "coordinador"];

// Lo que los agentes aprenden de ti. Antonio puede cambiar una regla si explica por qué;
// aquí se ve quién, cuándo y qué ponía antes, y se deshace con un toque.
export default async function Aprendizaje() {
  const [reglas, cambios] = await Promise.all([listarReglas(), listarCambiosDeReglas()]);
  const { porDecidir, activas, historial } = agruparReglas(reglas);
  const ultimo = ultimosCambios(cambios);
  const porAgente = agruparPor(
    [...activas].sort((a, b) => ORDEN.indexOf(a.agente) - ORDEN.indexOf(b.agente)),
    (r) => r.agente,
  );

  return (
    <Pantalla titulo="Aprendizaje" subtitulo="Lo que aplican los agentes. Lo que cambie Antonio lo ves aquí y lo puedes deshacer.">
      <Seccion titulo="Por decidir" cuenta={porDecidir.length}>
        {porDecidir.length ? (
          porDecidir.map((r) => <TarjetaPropuesta key={r.id} r={r} />)
        ) : (
          <Vacio titulo="Nada que decidir" texto="Cuando corrijas algo dos veces o las estadísticas enseñen algo claro, aparecerá aquí." />
        )}
      </Seccion>

      <Seccion titulo="Lo que ya aplican" cuenta={activas.length}>
        {activas.length ? (
          porAgente.map((g) => (
            <Tarjeta key={g.etiqueta}>
              <Etiqueta tono="bien">{g.etiqueta}</Etiqueta>
              <div>
                {g.items.map((r) => (
                  <FilaActiva key={r.id} r={r} cambio={ultimo.get(r.id)} />
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
          {historial.map((r) => {
            const cambio = ultimo.get(r.id);
            return (
              <div key={r.id}>
                <p className="suave pequeno">
                  {r.estado === "rechazada" ? "No" : "Quitada"} · {r.agente} · {r.regla} · {fecha(r.actualizada_en)}
                </p>
                {cambio && <UltimoCambio c={cambio} />}
              </div>
            );
          })}
        </Desplegable>
      )}
    </Pantalla>
  );
}
