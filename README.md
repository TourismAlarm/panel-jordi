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

## Hoy: resumen de la mañana y conexión con Google

La portada **Hoy** funciona sin Google (ELSA, Finanzas, Salud y Bandeja). Para ver también tu **agenda** y los **correos sin leer**:

1. En [Google Cloud Console](https://console.cloud.google.com) crea un proyecto → *APIs y servicios* → activa **Gmail API** y **Google Calendar API**.
2. *Pantalla de consentimiento OAuth*: tipo **Externo**, añade tu correo como usuario de prueba, y los permisos `gmail.readonly` y `calendar.readonly` (solo lectura).
3. *Credenciales* → **ID de cliente OAuth** de tipo *Aplicación web*. URI de redirección autorizado: `https://panel-jordi.vercel.app/api/google/callback`.
4. En Vercel (Production): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_TOKEN_KEY` (genérala con `openssl rand -hex 32`). Redeploy.
5. En el panel: **Ajustes → Conectar Google**.

**Aviso de Google**: `gmail.readonly` es un permiso «restringido». Mientras la app esté en modo **Pruebas**, Google caduca el permiso a los **7 días** y hay que volver a pulsar «Conectar Google». Si pasas la app a **En producción** sin verificar (solo la usas tú), el permiso no caduca y Google muestra un aviso de «app no verificada» al conectar: se acepta con *Avanzado → Continuar*. La verificación oficial de Google no hace falta para uso personal.

El resumen por correo necesita `RESEND_API_KEY` y `RESEND_FROM`; el texto redactado, `ANTHROPIC_API_KEY` (sin ella sale un resumen simple sin IA). El cron `/api/cron/resumen-diario` va a las 06:00 UTC (Vercel Hobby no garantiza el minuto ni permite más de 2 crons).

## Despliegue (pasos manuales)

1. **Vercel** → importar el repo y añadir las variables de `.env.example` (entornos Production y Preview). Sin `ALLOWED_EMAIL` nadie entra.
2. **Supabase** → Authentication → Sign In / Providers: desactiva «Allow new users to sign up» (el usuario ya existe).
3. Entra con tu email y contraseña de siempre (usuario `basecero5@gmail.com`, ya en `permitidos`).
4. El esquema está versionado en `supabase/migrations/`.

El acceso con Google (Gmail y Calendar) se añade en la Fase 5 como conexión de datos, no como login.
