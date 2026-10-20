import { vi } from "vitest";

// «server-only» solo existe dentro de Next; en las pruebas se anula.
vi.mock("server-only", () => ({}));

// Variables locales (.env.local) para la prueba de RLS; si no existe el archivo, se sigue sin ellas.
try {
  process.loadEnvFile(".env.local");
} catch {}
