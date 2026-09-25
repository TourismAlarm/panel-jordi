import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panel ELSA",
    short_name: "ELSA",
    description: "Preguntas y guiones de los vídeos de ELSA",
    start_url: "/",
    display: "standalone",
    background_color: "#141414",
    theme_color: "#141414",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
