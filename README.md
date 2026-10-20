# panel-jordi

Panel personal móvil primero: **Hoy · Finanzas · Salud · ELSA · Documentos** + Bandeja. Next.js (App Router) + TypeScript + Tailwind/shadcn + Supabase, desplegado en Vercel. Instalable como PWA.

- Un solo login (email y contraseña de Supabase, solo `ALLOWED_EMAIL`), un solo proyecto Supabase («Panel-jordi»), un solo diseño.
- Cada módulo vive en `app/(panel)/<modulo>/` y se registra en `config/modulos.ts`. Sus tablas llevan prefijo (`fin_`, `sal_`, `elsa_`, `doc_`) con `user_id` y RLS. (ELSA conserva por ahora sus nombres originales porque los escribe `sync_panel.py` desde el PC.)
- `lib/` compartida: `supabase/`, `anthropic.ts`, `resend.ts`, `cron-auth.ts`, `dinero.ts`, `fechas.ts`, `acceso.ts`.
- El panel ELSA (vídeos, preguntas, redes) está en `/elsa`: ver [ARQUITECTURA.md](ARQUITECTURA.md). No se conecta al ERP.

## Instalación local

```bash
npm install
cp .env.example .env.local   # rellena las variables
npm run dev
npm run typecheck && npm test && npm run build
```

`npm test` incluye `tests/rls.test.ts`: contra el Supabase real comprueba que otro usuario no lee ni modifica filas tuyas y que todas las tablas de `public` tienen RLS. Se salta si falta `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.

## Variables de entorno

Ver `.env.example`. Solo en Vercel o `.env.local`, nunca en el código.

## Despliegue (pasos manuales)

1. **Vercel** → importar el repo y añadir las variables de `.env.example` (entornos Production y Preview). Sin `ALLOWED_EMAIL` nadie entra.
2. **Supabase** → Authentication → Sign In / Providers: desactiva «Allow new users to sign up» (el usuario ya existe).
3. Entra con tu email y contraseña de siempre (usuario `basecero5@gmail.com`, ya en `permitidos`).
4. El esquema está versionado en `supabase/migrations/`.

El acceso con Google (Gmail y Calendar) se añade en la Fase 5 como conexión de datos, no como login.
