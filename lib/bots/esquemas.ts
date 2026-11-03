import { z } from "zod";

// Contrato de /api/bots/*: ver docs/bots-api.md. El bot nunca dice quién es: sale de su clave.
const instante = z.iso.datetime({ offset: true });

export const ActividadIn = z
  .object({
    tarea: z.string().trim().min(1).max(120),
    inicio: instante,
    fin: instante.optional(),
    resultado: z.enum(["ok", "fallo", "nada"]),
    nota: z.string().trim().max(2000).optional(),
    enlace: z.url({ protocol: /^https?$/ }).max(1000).optional(),
  })
  .refine((a) => !a.fin || new Date(a.fin) >= new Date(a.inicio), { message: "fin anterior a inicio", path: ["fin"] });

export const BandejaIn = z.object({
  tipo: z.enum(["aviso", "pregunta", "borrador"]),
  titulo: z.string().trim().min(1).max(200),
  cuerpo: z.string().trim().max(20000).optional(),
});

export const FiltroBandeja = z.enum(["nuevo", "leido", "respondido"]);
