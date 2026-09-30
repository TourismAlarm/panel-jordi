"use client";

import { useActionState } from "react";
import { BotonEnviar, ErrorCampo } from "@/components/ui";
import { deshacer } from "@/lib/acciones";

// Deshace un descarte o una petición mientras el PC no la haya recogido.
export function BotonDeshacer({ id }: { id: string }) {
  const [estado, accion] = useActionState(deshacer, null);
  return (
    <form action={accion} style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <input type="hidden" name="id" value={id} />
      <BotonEnviar texto="Deshacer" enviando="Deshaciendo…" variante="secundario" compacto />
      {estado?.error && <ErrorCampo>{estado.error}</ErrorCampo>}
    </form>
  );
}
