"use client";

import { useEffect } from "react";
import { Boton, Pantalla, Vacio } from "@/components/ui";

// Lo que sale si algo falla al cargar (sin conexión, Supabase caído…). Se puede reintentar.
export function PantallaError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Pantalla titulo="Algo ha fallado" accion={false}>
      <Vacio
        tono="mal"
        icono="alerta"
        titulo="No se han podido cargar los datos"
        texto="Puede ser la conexión. Si sigue pasando, el problema está en Supabase o en el PC."
      >
        <div style={{ width: "100%", marginTop: 10 }}>
          <Boton onClick={() => retry()}>Reintentar</Boton>
        </div>
      </Vacio>
    </Pantalla>
  );
}
