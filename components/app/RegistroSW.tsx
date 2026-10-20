"use client";

import { useEffect } from "react";

// Registra el service worker mínimo que permite instalar la app en el móvil.
export function RegistroSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
