# panel-jordi

Panel móvil del sistema de contenido de ELSA: preguntas pendientes y guiones de cada vídeo.

- Next.js (App Router) + `@supabase/ssr`, desplegado en Vercel.
- Lee y escribe en el proyecto Supabase `Panel-jordi` con la clave pública y la sesión de Jordi (RLS). Nunca usa la service_role.
- Desde la app solo se escriben `preguntas.respuesta` y `preguntas.respondida_en`. El resto lo sube `scripts/sync_panel.py` desde `D:\automatizaciones`.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (en `.env.local` para local y en Vercel).
