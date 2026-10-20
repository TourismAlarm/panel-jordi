# CHANGELOG

## Fase 2 — Finanzas (2026-10-20) · pendiente de migrar datos y probar en paralelo
- Módulo `/finanzas` con las 4 pantallas que tiene hoy Control-Financiero: **Inicio** (lo que te queda y cuánto al día hasta la nómina, gasto real por cuenta, traspasos, ritmo frente a los 3 meses anteriores, en qué se va, sin categoría), **Movimientos**, **Deudas** y **Ajustes** (mes financiero, bancos conectados, cuentas y papeles, categorías, importar CSV, exportar, borrar datos de prueba). Se ha portado la lógica y los componentes existentes; solo se han adaptado sesión, tablas y colores.
- Tablas `fin_*` en Panel-jordi (migración `20261020120000_finanzas.sql`, aplicada, vacías) con `user_id` uuid, RLS por usuario y trigger de categorías por defecto. `fin_bank_links` y `fin_bank_auth_states` solo las toca el servidor.
- Rutas API en `/api/finanzas/*` (el servidor usa service_role filtrando por user_id, como la app original; el navegador usa su sesión y RLS). Cron diario `/api/cron/finanzas-bancos` (05:47 UTC, protegido con `CRON_SECRET`).
- IBAN: nunca completo. Solo últimos 4 + huella HMAC (`IBAN_HASH_SECRET`) para reconocer traspasos propios. Los números largos (IBAN, tarjetas) en textos se guardan como «···1234» (sincronización, alta/edición de movimientos y migración).
- Script de migración `scripts/finanzas/migrar.ts`: `backup` → `dry-run` → `ejecutar --confirmo` → `comparar` (filas e importes por cuenta y mes).
- Pruebas: 95 (banca, deudas, flujo de gasto, presupuesto por día, ritmo de gasto, próxima nómina, enmascarado, huella de IBAN, transformación de la migración) + RLS real de `fin_*`.
- Quitado (no tenía pantalla en la app real): presupuestos, metas de ahorro, recurrentes, panel clásico, gráficas, agentes de notificaciones, módulo de préstamos antiguo, `/api/db`, NextAuth, offline. Sus tablas (budgets, savings_goals, recurring_rules, transfers) sí existen en `fin_*` para no perder datos.

## Fase 1 — Carcasa (2026-10-20)
- Login con email y contraseña de Supabase (el usuario que ya existía); solo entra `ALLOWED_EMAIL`. Cualquier otro ve «Acceso denegado» (comprobado al entrar y en `proxy.ts`).
- Navegación: barra inferior en móvil (botones de 72 px), lateral en escritorio, buscador con `/` o Ctrl/Cmd+K. Módulos registrados en un único archivo: `config/modulos.ts`.
- Módulo ELSA movido a `/elsa` sin reescribirlo (subnavegación Proyectos · Redes · Aprende · Actividad). Hoy, Finanzas, Salud y Documentos: pantalla «Próximamente».
- Tabla `bandeja` (migración `20261020100000_bandeja.sql`, ya aplicada en Panel-jordi) con RLS y su página `/bandeja`; `dejarEnBandeja()` para automatizaciones.
- `lib/` compartida: supabase (servidor, navegador, admin), anthropic (JSON validado con Zod, reintentos, reglas en cada system prompt), resend, cron-auth, dinero, fechas.
- Tema claro/oscuro/automático (`/ajustes`), paleta neutra (rojo solo para errores/excedido), botones más grandes (también en ELSA).
- PWA: manifest «Panel Jordi» + service worker mínimo instalable.
- Pruebas: dinero, fechas, cron-auth, acceso, anthropic y `tests/rls.test.ts` (RLS real; necesita `SUPABASE_SERVICE_ROLE_KEY`).
