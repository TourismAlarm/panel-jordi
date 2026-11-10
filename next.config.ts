import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las respuestas: el panel no se puede meter en un marco de otra web,
// el navegador no adivina tipos de archivo y hacia fuera solo sale el dominio, nunca la ruta.
const CABECERAS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: CABECERAS }];
  },
};

export default nextConfig;
