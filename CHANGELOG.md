# CHANGELOG

## Fase 1 — Carcasa (2026-10-20)
- Login único con Google; solo entra `ALLOWED_EMAIL`. Cualquier otro ve «Acceso denegado» (comprobado en `/auth/callback` y en `proxy.ts`).
- Navegación: barra inferior en móvil (botones de 72 px), lateral en escritorio, buscador con `/` o Ctrl/Cmd+K. Módulos registrados en un único archivo: `config/modulos.ts`.
- Módulo ELSA movido a `/elsa` sin reescribirlo (subnavegación Proyectos · Redes · Aprende · Actividad). Hoy, Finanzas, Salud y Documentos: pantalla «Próximamente».
- Tabla `bandeja` (migración `20261020100000_bandeja.sql`, ya aplicada en Panel-jordi) con RLS y su página `/bandeja`; `dejarEnBandeja()` para automatizaciones.
- `lib/` compartida: supabase (servidor, navegador, admin), anthropic (JSON validado con Zod, reintentos, reglas en cada system prompt), resend, cron-auth, dinero, fechas.
- Tema claro/oscuro/automático (`/ajustes`), paleta neutra (rojo solo para errores/excedido), botones más grandes (también en ELSA).
- PWA: manifest «Panel Jordi» + service worker mínimo instalable.
- Pruebas: dinero, fechas, cron-auth, acceso, anthropic y `tests/rls.test.ts` (RLS real; necesita `SUPABASE_SERVICE_ROLE_KEY`).
