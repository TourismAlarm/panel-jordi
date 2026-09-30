"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icono } from "./Icono";
import s from "./BotonActualizar.module.css";

// Vuelve a pedir los datos al servidor sin recargar la página (en la app instalada no hay «tirar para refrescar»).
export function BotonActualizar() {
  const router = useRouter();
  const [cargando, empezar] = useTransition();
  return (
    <button
      type="button"
      className={s.boton}
      onClick={() => empezar(() => router.refresh())}
      disabled={cargando}
      aria-label="Actualizar datos"
      data-cargando={cargando || undefined}
    >
      <Icono nombre="actualizar" tamano={20} />
    </button>
  );
}
