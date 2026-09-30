import s from "./Opciones.module.css";

// Elegir una opción tocando una pastilla (radio de toda la vida, con otra cara). Va dentro de un <form>.
export function Opciones({
  nombre,
  opciones,
  defecto,
}: {
  nombre: string;
  opciones: { valor: string; texto: string }[];
  defecto?: string;
}) {
  return (
    <div className={s.opciones} role="radiogroup">
      {opciones.map((o) => (
        <label key={o.valor} className={s.opcion}>
          <input type="radio" name={nombre} value={o.valor} defaultChecked={o.valor === defecto} required />
          <span>{o.texto}</span>
        </label>
      ))}
    </div>
  );
}
