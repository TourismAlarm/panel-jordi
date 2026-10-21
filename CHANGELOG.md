# CHANGELOG

## Fase 5 — Hoy (2026-10-21)
- **Portada «Hoy»** (`/`): lo **urgente** arriba en rojo, luego la agenda de hoy, «Para hoy», los correos sin leer y, plegado, «Para saber». Reúne ELSA (proyectos que te tocan, ordenados por fecha; reglas por decidir; PC sin sincronizar), Finanzas (conexiones bancarias caducadas, cuotas de deudas de los próximos 3 días, ritmo hasta la nómina, movimientos sin categoría), Salud (aviso médico, resumen, datos viejos) y Bandeja. Si un módulo falla se dice arriba («No se ha podido leer: …»), no se esconde.
- La ordenación y las señales son **lógica pura sin IA** (`lib/hoy/senales.ts`, con pruebas). La IA solo redacta el texto del resumen a partir de ellas; si no hay clave o falla, el resumen sale igual sin IA.
- **Resumen de la mañana por correo** (Resend, a tu correo): cron `/api/cron/resumen-diario` (protegido con `CRON_SECRET`, una vez al día, idempotente) y botón **«Enviarme el resumen ahora»**. Cada resumen se guarda en `resumenes_diarios` (RLS).
- **Gmail y Calendar, solo lectura** (`gmail.readonly`, `calendar.readonly`): botón «Conectar Google» en Ajustes; el refresh token se guarda **cifrado con AES-256-GCM** (`GOOGLE_TOKEN_KEY`) en `google_tokens`, tabla sin acceso desde el navegador. Del correo solo se leen remitente, asunto y un extracto; el panel no puede enviar, borrar ni modificar nada. El texto de correos y eventos se trata como dato, nunca como instrucción para la IA.
- Se extrae `resumenInicio()` de la ruta de Finanzas para que Inicio de Finanzas y «Hoy» usen el mismo cálculo. `/finanzas?tab=movements|debts` abre esa pestaña.
- Migración `20261021180000_hoy.sql` (aplicada). Pruebas nuevas: señales, correo (escapado), resumen sin IA, cifrado.
- **Hora del resumen**: Vercel Hobby solo permite 2 crons diarios y los lanza con hasta una hora de margen, y la hora del cron es UTC. Está en `0 6 * * *`: de finales de octubre a marzo llega sobre las 7:00 (en horario de verano, sobre las 8:00). Con plan Pro se puede afinar.

## Fase 3 — Salud (2026-10-21)
- Módulo `/salud` con **Hoy** (tarjetas de sueño, pasos, pulso en reposo, peso, ánimo y energía con su cambio frente a tu media de 7 días; resumen en frases; últimos entrenos), **Histórico** (gráficas de 7/30/90 días por métrica con media, mínimo y máximo) y **Registrar** (ánimo, energía, peso, síntomas, condición médica y notas, con botones grandes).
- No existía una app de Salud anterior: las tablas `sal_metricas` (formato largo: día + métrica + valor + fuente), `sal_entrenos` y `sal_registros` son nuevas (migración `20261021120000_salud.sql`, aplicada), con RLS. Desde el navegador solo se escribe lo «manual»; los datos del reloj entran por el servidor.
- **Entrada de datos del PC**: `POST /api/salud/ingesta` protegida con `SALUD_INGESTA_SECRET` (no hace falta ninguna clave de Supabase en el PC). Repetir un envío no duplica. Contrato y ejemplo en `docs/pc-salud.md`.
- **Seguridad médica**: si apuntas dolor agudo, mareo, dolor de pecho, falta de aire, desmayo, una condición médica o escribes palabras de alarma, sale el aviso «Consulta a un médico» (en directo y tras guardar; también en Hoy si hubo uno en los últimos 3 días). La app no diagnostica ni receta; el resumen solo te compara contigo mismo y no usa IA.
- Pruebas: aviso médico, resumen/medias, contrato de ingesta, autenticación bearer y RLS de `sal_*` (también comprobada en la base real).
- Pendiente de la fase: el resumen diario por correo. Se decidió incluir la salud dentro del resumen matutino de «Hoy» (Fase 5); la lógica (`lib/salud/resumen.ts`) ya está lista para reutilizarla.

## Fase 2 — Finanzas (2026-10-20) · datos migrados el 21-10-2026; falta probar en paralelo
- Módulo `/finanzas` con las 4 pantallas que tiene hoy Control-Financiero: **Inicio** (lo que te queda y cuánto al día hasta la nómina, gasto real por cuenta, traspasos, ritmo frente a los 3 meses anteriores, en qué se va, sin categoría), **Movimientos**, **Deudas** y **Ajustes** (mes financiero, bancos conectados, cuentas y papeles, categorías, importar CSV, exportar, borrar datos de prueba). Se ha portado la lógica y los componentes existentes; solo se han adaptado sesión, tablas y colores.
- Tablas `fin_*` en Panel-jordi (migración `20261020120000_finanzas.sql`, aplicada, vacías) con `user_id` uuid, RLS por usuario y trigger de categorías por defecto. `fin_bank_links` y `fin_bank_auth_states` solo las toca el servidor.
- Rutas API en `/api/finanzas/*` (el servidor usa service_role filtrando por user_id, como la app original; el navegador usa su sesión y RLS). Cron diario `/api/cron/finanzas-bancos` (05:47 UTC, protegido con `CRON_SECRET`).
- IBAN: nunca completo. Solo últimos 4 + huella HMAC (`IBAN_HASH_SECRET`) para reconocer traspasos propios. Los números largos (IBAN, tarjetas) en textos se guardan como «···1234» (sincronización, alta/edición de movimientos y migración).
- Script de migración `scripts/finanzas/migrar.ts`: `backup` → `dry-run` → `ejecutar --confirmo` → `comparar` (filas e importes por cuenta y mes).
- Pruebas: 95 (banca, deudas, flujo de gasto, presupuesto por día, ritmo de gasto, próxima nómina, enmascarado, huella de IBAN, transformación de la migración) + RLS real de `fin_*`.
- **Datos migrados (21-10-2026)**: 341 movimientos, 4 cuentas, 26 categorías, 28 reglas, 4 bancos (sesiones incluidas), 2 deudas, 9 pagos de deuda, 4 devoluciones enlazadas y el perfil (día de cobro 25). Se hizo por SQL desde el panel de Supabase (no con `scripts/finanzas/migrar.ts`, que queda como alternativa): carga a tablas temporales, huella por mes idéntica al archivo origen, ensayo deshecho y carga real con comprobación interna (32/32 grupos cuenta·mes·tipo coinciden en filas e importes). 3 textos con un número de 16 dígitos quedaron como «···3831». Los `created_at` originales no se conservan (son de la fecha de migración).
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
