# panel-jordi

Panel personal móvil primero: **Hoy · Finanzas · Salud · ELSA · Documentos** + Bandeja. Next.js (App Router) + TypeScript + Tailwind/shadcn + Supabase, desplegado en Vercel. Instalable como PWA.

- Un solo login (Google, solo `ALLOWED_EMAIL`), un solo proyecto Supabase («Panel-jordi»), un solo diseño.
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

1. **Google Cloud** → APIs y servicios → Credenciales → ID de cliente OAuth (aplicación web). URI de redirección autorizado: `https://fcbywngenmmsudqqnwav.supabase.co/auth/v1/callback`.
2. **Supabase** → Authentication → Providers → Google: activar con ese Client ID y Secret. Authentication → URL Configuration: Site URL = la URL de Vercel; Redirect URLs: `https://<tu-dominio>/auth/callback` y `http://localhost:3000/auth/callback`.
3. **Vercel** → importar el repo y añadir las variables de `.env.example`.
4. Primer login con basecero5@gmail.com: Supabase enlaza Google a tu usuario existente (mismo correo) y sigues en `permitidos`.
5. El esquema está versionado en `supabase/migrations/`.

Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (en `.env.local` para local y en Vercel).

**Cómo está montado y cómo añadir cosas: [ARQUITECTURA.md](ARQUITECTURA.md).** Las piezas visuales se ven en la propia app, en Más → Piezas de la app.

```bash
npm run dev         # en local
npm run typecheck   # comprobar tipos
npm run build       # compilación completa
```
