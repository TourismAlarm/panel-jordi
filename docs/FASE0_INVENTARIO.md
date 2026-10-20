# Fase 0 — Inventario y plan (pendiente de aprobación)

Auditoría de solo lectura. No se ha modificado ni borrado nada. No se ha leído el ERP (`ELSA-ERP.app`, `Elsa-ERP-dev`).

## 0. Lo que no he podido auditar

| Qué | Motivo |
|---|---|
| **App de Salud** | No hay ningún repo de salud en tu GitHub (repos visibles: Control-Financiero, panel-jordi, ELSA-ERP.app, tourism-alarm-mvp-hybrid, Maresme-proveidors, Presupuestos-ELSA, Tourism-Alarm, tourism-alarm-catalunya, crypto-tax-tracker, Tourism-control, turbo-waffle). No sé qué fuentes usa (Garmin, Xiaomi…), ni el resumen diario por correo. |
| **Datos reales de Finanzas** | Su Supabase no aparece entre tus proyectos accesibles (solo Panel-jordi, Elsa-ERP-dev, Elsa Organizacion-inactivo). Sin acceso no puedo contar filas ni importes. |
| **Scripts del PC** (`D:\automatizaciones\scripts\sync_panel.py`) | Están en tu PC, no en un repo. Son quien escribe en las tablas del panel ELSA. |

## 1. Control-Financiero (rama main, Next 15.5 / React 18)

**Pantallas**: `/` (HomeScreen, Movimientos, Deudas en `components/v2/`; dashboard clásico con presupuesto, metas, recurrentes, estadísticas, categorías, exportar, importar CSV, QuickAdd), `/configuracion` (bancos conectados, cuentas y roles), `/onboarding`, `/auth/*` (login, registro, recuperar contraseña), préstamos (`components/loans/*.jsx`).

**Tablas** (`supabase/schema_completo.sql`, `user_id` es TEXT = id de Google):
`profiles` (email, full_name, currency, financial_month_start_day), `accounts` (name, type, balance, role), `categories`, `transactions` (type, amount, date, kind: regular/internal_transfer/investment/debt_payment, source, external_id, counterparty, bank_link_id, devoluciones), `budgets` (por categoría/mes/año, alert_threshold), `recurring_rules`, `transfers`, `loans` + `loan_payments`, `savings_goals`, `agent_notifications`, `bank_links` (**guarda `iban` completo**, `session_id`, `account_uid`), `bank_auth_states`, `dismissed_suggestions`, `category_rules`. Migraciones 000–015 numeradas + carpeta `archivo/` con ~20 SQL obsoletos.

**Lógica**: mes financiero desde la nómina (`financialMonth.ts`, `period.ts`), flujo/resumen sin doble conteo (`summary/flow.ts`), traspasos y gasto real por cuenta, detección de deudas (`debts/`), auto-categorización con reglas (`categorization/`), agentes estadísticos locales (anomalías >2σ, recomendación de presupuesto, notificaciones, proyección a 3 meses por regresión lineal), exportación PDF/Excel/JSON, modo offline (IndexedDB + cola).

**Crons**: `/api/cron/sync-banks` a las 05:17 UTC (`vercel.json`), protegido con `CRON_SECRET`.

**Integraciones**: Enable Banking (BBVA, Revolut, Trade Republic), Google OAuth vía NextAuth.

**Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID/SECRET`, `ENABLE_BANKING_APP_ID`, `ENABLE_BANKING_PRIVATE_KEY`, `ENABLE_BANKING_REDIRECT_URL`, `BANK_OWN_NAMES`, `CRON_SECRET`.

**Tests existentes**: banking/transform, debts/detect, summary/flow. **No hay tests** de presupuesto, ritmo de gasto ni proyección (los pide la Fase 2).

| Decisión | Qué |
|---|---|
| Reutilizar tal cual | `lib/banking/*`, `lib/debts/*`, `lib/summary/flow.ts`, `lib/categorization/*`, `financialMonth.ts`, `period.ts`, `agents/*`, componentes de `finance/`, `charts/`, `v2/`, `loans/`, export, importación CSV |
| Adaptar | Auth (NextAuth → Supabase Auth); `user_id` TEXT → uuid; tablas con prefijo `fin_`; clientes Supabase (hay 4 duplicados); React 18→19 / Next 15→16; guardar solo últimos 4 dígitos del IBAN; RLS real (hoy se filtra por `user_id` en servidor con service_role: `supabase/scoped.ts`) |
| Sobra | `next-auth`, `@auth/supabase-adapter`, `auth-helpers-*` (obsoleto), páginas de registro/recuperación (login será solo Google), `api/db`, `api/financial-data` y `financialDataSync.js` (tablas antiguas `financial_data`/`monthly_history`), `api/admin/clear-data` (peligrosa), `docs/archivo`, `supabase/archivo`, `scripts/archivo`, `public/sw.js` y `workbox` generados |

## 2. panel-jordi = panel ELSA (Next 16.3.7 / React 19, CSS modules, sin Tailwind)

**Es el panel ELSA**: sistema de contenido en vídeo (guiones, preguntas, montaje, redes). Ya tiene login Supabase Auth + tabla `permitidos` + `es_permitido()`, PWA (`manifest.ts`), `proxy.ts` que fuerza sesión, kit visual propio (`components/ui`), tests con vitest (`pasos`, `redes`).

**Pantallas**: Hoy (`/`), Vídeos y detalle/guion, Redes (Instagram · TikTok), Aprendizaje (reglas), Actividad (agentes), Nuevo (pedir guion / edición sin guion), Más, Piezas.

**Tablas y datos reales hoy**: `videos` 23, `preguntas` 18, `ejecuciones_agentes` 402, `peticiones` 39, `sync_estado` 1, `reglas` 16, `windsor_fotos` 12, `windsor_fotos_tiktok` 2, `redes_reels` 20, `informes_redes` 4, `permitidos` 1, `auth.users` 1.

**Integraciones**: ninguna directa desde Vercel. Todo lo sube el PC (`sync_panel.py`) con permisos de servicio: vídeos, preguntas, Windsor (Instagram/TikTok), Drive. **Sin crons en Vercel.** Variables: solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

**Reutilizar tal cual**: todo el módulo ELSA, el login/`proxy.ts`/PWA como base de la carcasa. **Adaptar**: mover las pantallas a `app/(panel)/elsa/`, entrada en navegación. **Sobra**: nada.

⚠️ Este Supabase (`Panel-jordi`, eu-west-2) ya tiene auth y es el natural "único proyecto".

## 3. Conflictos que hay que decidir

1. **Tailwind + shadcn (pedido) vs. CSS modules (panel actual).** Propuesta: la carcasa y los módulos nuevos (Finanzas, Hoy, Documentos, Salud) usan Tailwind + shadcn; el módulo ELSA conserva sus CSS modules sin reescribir (regla de oro). Los tokens de color se comparten para que se vea un solo diseño.
2. **Prefijo `elsa_` vs. script del PC.** Renombrar `videos`, `preguntas`… a `elsa_*` rompe `sync_panel.py` hasta que lo actualices. Opciones: (a) renombrar y tú cambias el script el mismo día; (b) mantener los nombres actuales como excepción documentada. Recomiendo **(b)** en la Fase 4 y renombrar más adelante.
3. **ELSA no tiene `user_id`** (autoriza con `es_permitido()`). Con un solo usuario es válido; lo mantengo y los módulos nuevos usan `user_id` + RLS `auth.uid()`.

## 4. Esquema unificado propuesto (proyecto Panel-jordi)

- **Común**: `bandeja` (modulo, tipo aviso/pregunta/borrador, titulo, cuerpo, estado nuevo/leido/respondido, respuesta, created_at + `user_id`), `permitidos` (existente), `google_tokens` (refresh token cifrado, Fase 5), `resumenes_diarios` (Fase 5).
- **`fin_*`** = tablas actuales con `user_id uuid references auth.users`; `profiles`→`fin_perfil`; `bank_links.iban` → `iban_ultimos4`; sin `bank_auth_states` persistente más allá de minutos.
- **`sal_*`**: pendiente del inventario de Salud.
- **`elsa_*`/actuales**: se quedan (ver conflicto 2).
- **`doc_*`** (Fase 6): `doc_documentos`, `doc_paginas` (tsvector `spanish`), `doc_fichas`, `doc_alertas`, bucket privado `documentos`.
- RLS en todas con `user_id = auth.uid()`; prueba automática que lo verifique.

## 5. Plan de migración de Finanzas (Fase 2)

1. Backup completo del Supabase actual (`pg_dump` + export JSON) guardado fuera del repo.
2. Mapa `profiles.id` (Google id) → `auth.users.id` (se crea al primer login con Google; el script lo resuelve por email).
3. Script idempotente (`external_id`/id original como clave) con `--dry-run`, luego ejecución.
4. Informe: filas y suma de importes por cuenta y mes, origen vs destino.
5. Los IBAN se truncan a 4 dígitos antes de escribirse. Los enlaces bancarios (`session_id`) caducan, así que probablemente haya que **reconectar los bancos** en la app nueva (el cron de la vieja y el de la nueva no deben correr a la vez con las mismas sesiones).
6. Uso en paralelo hasta que cuadren las cifras. No se toca la app vieja.

## 6. Orden de fases y riesgos

Fases 1→6 como en el encargo. Riesgos: falta Salud; datos de Finanzas sin acceso; reconexión bancaria; Next 16 tiene cambios (leer `node_modules/next/dist/docs/` antes de codificar); scopes de Gmail con Google en modo Testing caducan el refresh token a los 7 días, salvo que la app pase a "In production" sin verificar (aviso de app no verificada, pero funciona para ti).

## 7. Lo que necesito de ti para aprobar

Ver mensaje de la sesión.
