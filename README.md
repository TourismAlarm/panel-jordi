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

La portada **Hoy** reúne ELSA, Finanzas, Salud, Documentos y Bandeja. El **resumen redactado** lo genera la API de Anthropic cada mañana (cron `/api/cron/resumen-diario`, 06:00 UTC) y se lee en la app; el botón «Actualizar el resumen» lo regenera. Sin correo. Necesita `ANTHROPIC_API_KEY` y `CRON_SECRET`.

Para ver también la **agenda** y los **correos sin leer** (solo lectura):

1. En [Google Cloud Console](https://console.cloud.google.com) crea un proyecto → *APIs y servicios* → activa **Gmail API** y **Google Calendar API**.
2. *Pantalla de consentimiento OAuth*: tipo **Externo**, añade tu correo como usuario de prueba y los permisos `gmail.readonly` y `calendar.readonly`.
3. *Credenciales* → **ID de cliente OAuth** de tipo *Aplicación web*. URI de redirección: `https://panel-jordi.vercel.app/api/google/callback`.
4. En Vercel (Production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_TOKEN_KEY` (`openssl rand -hex 32`). Redeploy.
5. En el panel: **Ajustes → Conectar Google**.

**Aviso de Google**: `gmail.readonly` es un permiso «restringido». Con la app en modo *Pruebas* el permiso caduca a los **7 días** y hay que volver a pulsar «Conectar Google». Si la pasas a *En producción* sin verificar (solo la usas tú), no caduca y Google muestra «app no verificada» al conectar (*Avanzado → Continuar*). La verificación oficial no hace falta para uso personal.

## Documentos

Subes archivos en **Documentos → Añadir**; la IA (API de Anthropic) los lee y rellena la ficha y el texto por página; el chat responde con citas. Variables en Vercel: `ANTHROPIC_API_KEY` (y `ANTHROPIC_MODEL` si quieres otro modelo; por defecto `claude-sonnet-5-5`). Pasos manuales en Supabase: ninguno (la migración crea el bucket privado y sus políticas).

## Despliegue (pasos manuales)

1. **Vercel** → importar el repo y añadir las variables de `.env.example` (entornos Production y Preview). Sin `ALLOWED_EMAIL` nadie entra.
2. **Supabase** → Authentication → Sign In / Providers: desactiva «Allow new users to sign up» (el usuario ya existe).
3. Entra con tu email y contraseña de siempre (usuario `basecero5@gmail.com`, ya en `permitidos`).
4. El esquema está versionado en `supabase/migrations/`.

El acceso con Google (Gmail y Calendar) se añade en la Fase 5 como conexión de datos, no como login.
