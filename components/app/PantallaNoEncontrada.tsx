import Link from "next/link";
import { Pantalla, Vacio } from "@/components/ui";

export function PantallaNoEncontrada() {
  return (
    <Pantalla titulo="No está" accion={false}>
      <Vacio tono="neutro" icono="alerta" titulo="Esto no existe" texto="Puede que el PC aún no lo haya subido.">
        <Link href="/">Volver al inicio</Link>
      </Vacio>
    </Pantalla>
  );
}
