import { MarcoApp } from "@/components/app/MarcoApp";
import { PantallaNoEncontrada } from "@/components/app/PantallaNoEncontrada";

// Direcciones que no existen: misma pantalla que dentro del panel, con su barra de pestañas.
export default function NoEncontrado() {
  return (
    <MarcoApp>
      <PantallaNoEncontrada />
    </MarcoApp>
  );
}
