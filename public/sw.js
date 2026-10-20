// Service worker mínimo: hace la app instalable. No guarda nada en caché (los datos siempre vienen frescos).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
