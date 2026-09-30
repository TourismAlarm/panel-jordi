import s from "./Esqueleto.module.css";

// Bloque gris que late mientras llegan los datos.
export function Esqueleto({ alto = 18, ancho = "100%", redondo = false }: { alto?: number; ancho?: number | string; redondo?: boolean }) {
  return <span className={s.esqueleto} style={{ height: alto, width: ancho, borderRadius: redondo ? "50%" : undefined }} aria-hidden />;
}

// Pantalla entera «cargando»: título + unas cuantas tarjetas. La usan los loading.tsx.
export function EsqueletoPantalla({ tarjetas = 3, cifras = false }: { tarjetas?: number; cifras?: boolean }) {
  return (
    <main className={s.pantalla} aria-busy aria-label="Cargando">
      <div className={s.cabecera}>
        <Esqueleto alto={34} ancho="55%" />
        <Esqueleto alto={42} ancho={42} redondo />
      </div>
      {cifras && (
        <div className={s.cifras}>
          {Array.from({ length: 4 }, (_, i) => (
            <Esqueleto key={i} alto={76} />
          ))}
        </div>
      )}
      {Array.from({ length: tarjetas }, (_, i) => (
        <div key={i} className={s.tarjeta}>
          <Esqueleto alto={12} ancho="25%" />
          <Esqueleto alto={20} ancho="80%" />
          <Esqueleto alto={14} ancho="55%" />
        </div>
      ))}
    </main>
  );
}
