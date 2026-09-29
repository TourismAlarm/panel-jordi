# panel-jordi

Panel móvil del sistema de contenido de ELSA: lo que te toca, preguntas pendientes, guiones y actividad de los agentes.

- Next.js (App Router) + `@supabase/ssr`, desplegado en Vercel. Se instala en el móvil como app (PWA).
- Lee y escribe en el proyecto Supabase `Panel-jordi` con la clave pública y la sesión de Jordi (RLS). Nunca usa la service_role.
- Desde la app solo se escriben `preguntas.respuesta` y `preguntas.respondida_en`. El resto lo sube `scripts/sync_panel.py` desde `D:\automatizaciones`.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (en `.env.local` para local y en Vercel).

**Cómo está montado y cómo añadir cosas: [ARQUITECTURA.md](ARQUITECTURA.md).** Las piezas visuales se ven en la propia app, en Más → Piezas de la app.

```bash
npm run dev         # en local
npm run typecheck   # comprobar tipos
npm run build       # compilación completa
```
