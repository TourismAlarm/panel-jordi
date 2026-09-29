"use client";

import { useFormStatus } from "react-dom";
import { Boton, type Variante } from "./Boton";

// Botón de formulario que se bloquea y cambia el texto mientras se envía.
export function BotonEnviar({
  texto,
  enviando = "Enviando…",
  variante,
}: {
  texto: string;
  enviando?: string;
  variante?: Variante;
}) {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" variante={variante} disabled={pending} aria-busy={pending}>
      {pending ? enviando : texto}
    </Boton>
  );
}
