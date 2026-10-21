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

## Finanzas: migrar los datos de Control-Financiero

El módulo funciona vacío desde ya. Para traer tus datos (nada se escribe sin tu orden):

```bash
# en .env.local: ORIGEN_SUPABASE_URL, ORIGEN_SUPABASE_SERVICE_ROLE_KEY (proyecto viejo, solo se lee),
# NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (Panel-jordi) e IBAN_HASH_SECRET (la misma que en Vercel)
npx tsx scripts/finanzas/migrar.ts backup           # copia completa en backups/ (guárdala también fuera del equipo)
npx tsx scripts/finanzas/migrar.ts dry-run          # cuenta y comprueba, no escribe
npx tsx scripts/finanzas/migrar.ts ejecutar --confirmo
npx tsx scripts/finanzas/migrar.ts comparar         # filas e importes por cuenta y mes, origen vs destino
```

Es idempotente (conserva los id originales: repetirlo no duplica). Las dos apps pueden usarse en paralelo; el cron de bancos del panel corre a las 05:47 UTC, el de la app vieja a las 05:17.

Enable Banking: usa las mismas credenciales que la app vieja (`ENABLE_BANKING_APP_ID`/`PRIVATE_KEY`); en su panel añade como redirect URL `https://<tu-dominio>/api/finanzas/banking/callback`. Las sesiones de banco ya existentes se copian con la migración.

## Hoy: resumen de la mañana

La portada **Hoy** funciona sola con ELSA, Finanzas, Salud y Bandeja. El **resumen redactado, la agenda y los correos** los deja cada mañana una **tarea programada de Claude** (sin API de pago ni correo electrónico): ver `docs/hoy-tarea-claude.md` (prompt incluido). Variable necesaria en Vercel: `HOY_RESUMEN_SECRET` (16+ caracteres aleatorios).

Opcional: conectar Gmail y Calendar directamente desde el panel (solo lectura). Necesita un cliente OAuth de Google Cloud con `gmail.readonly` y `calendar.readonly`, URI de redirección `https://panel-jordi.vercel.app/api/google/callback`, y `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_TOKEN_KEY` (`openssl rand -hex 32`) en Vercel; luego **Ajustes → Conectar Google**. Con la app de Google en modo *Pruebas* el permiso caduca a los 7 días; en *Producción* sin verificar no caduca (aviso de «app no verificada» al conectar). Si usas la tarea de Claude, esto no hace falta.

## Documentos

Subes archivos en **Documentos → Añadir**; una tarea programada de Claude los lee y rellena la ficha (`docs/documentos-tarea-claude.md`, con el prompt). Variable en Vercel: `DOCS_TAREA_SECRET` (16+ caracteres aleatorios). Pasos manuales en Supabase: ninguno (la migración crea el bucket privado y sus políticas). Sin la tarea, los documentos se guardan igual y la ficha se rellena a mano.

## Despliegue (pasos manuales)

1. **Vercel** → importar el repo y añadir las variables de `.env.example` (entornos Production y Preview). Sin `ALLOWED_EMAIL` nadie entra.
2. **Supabase** → Authentication → Sign In / Providers: desactiva «Allow new users to sign up» (el usuario ya existe).
3. Entra con tu email y contraseña de siempre (usuario `basecero5@gmail.com`, ya en `permitidos`).
4. El esquema está versionado en `supabase/migrations/`.

El acceso con Google (Gmail y Calendar) se añade en la Fase 5 como conexión de datos, no como login.
