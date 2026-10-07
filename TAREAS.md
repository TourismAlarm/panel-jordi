# TAREAS — Panel ELSA

Plan de mejoras del panel (`panel-jordi`) y del sincronizador (`D:\automatizaciones\scripts\sync_panel.py`).
Revisado el 30-09-2026 a partir del código de las dos ramas, el informe de ChatGPT del 29-09 y las políticas reales de Supabase.

## Reglas para Claude Code

- **Una fase por sesión.** No empieces la siguiente sin que Jordi haya dado por buena la anterior.
- **Un commit por tarea**, con el código de la tarea en el mensaje (p. ej. `T1.2: recoger respuestas sin duplicar`).
- Cada tarea trae su **«Hecho cuando»**. Si no se puede comprobar, no está hecha.
- En `panel-jordi`, antes de cada commit: `npm run typecheck`. Lee `AGENTS.md` (Next 16 tiene cambios).
- No toques nada que no esté en la tarea. Si ves algo roto fuera de alcance, apúntalo al final de este archivo en «Encontrado por el camino».
- Los cambios de base de datos van siempre como migración en `panel-jordi/supabase/migrations/` y después se regeneran los tipos (`lib/supabase/tipos.ts`).
- Proyecto Supabase: `Panel-jordi` (`fcbywngenmmsudqqnwav`).

## Estado de seguridad comprobado (30-09)

Esto ya está bien, no lo toques:

- Todas las tablas tienen RLS activado. `videos`, `preguntas` y `ejecuciones_agentes` solo se pueden leer si `es_permitido()`.
- `es_permitido()` es `security definer` con `search_path = ''`, así que es correcta.
- `permitidos` tiene RLS y ninguna política, así que nadie puede leerla ni escribirla desde la app. Es lo que queremos.
- En `preguntas`, la app solo puede actualizar las columnas `respuesta` y `respondida_en`, y solo mientras `recogida_en` esté vacío. Está bien.

Lo que sobra está en la T0.2.

---

## FASE 0 — Urgente (hoy o mañana)

### T0.1 · Actualizar Next.js a 16.3.7 — `panel-jordi`, rama `main`
El aviso de seguridad de Next.js anunciaba la 16.3.7 para el 30-09, con 1 vulnerabilidad crítica y 2 altas.
1. Comprueba que 16.3.7 está publicada (`npm view next versions --json | tail`). Si no lo está, para y avisa.
2. `npm i next@16.3.7`, `npm run build` y despliega.
3. Haz lo mismo en la rama `claude/app-architecture-refactor-juh476` (o rebasa sobre `main`).

**Hecho cuando:** `package.json` tiene `"next": "16.3.7"` en las dos ramas y Vercel despliega sin errores.

### T0.2 · Quitar permisos sobrantes — migración `20260930_permisos_minimos.sql`
La tabla `peticiones` tiene concedido todo (`UPDATE`, `TRUNCATE`…) a `anon` y a `authenticated`. RLS lo frena en la práctica, pero no debe estar concedido. `anon` tampoco necesita nada en ninguna tabla.

```sql
-- anon no usa ninguna tabla (la app siempre va con sesión)
revoke all on public.videos, public.preguntas, public.ejecuciones_agentes, public.peticiones from anon;

-- peticiones: la app solo lee, crea (sin elegir id, fechas ni recogida) y borra para deshacer
revoke all on public.peticiones from authenticated;
grant select, delete on public.peticiones to authenticated;
grant insert (tipo, video_id, motivo, texto, fecha_trabajo) on public.peticiones to authenticated;

-- lectura: sin cambios de uso, solo se quitan TRIGGER y REFERENCES
revoke trigger, references on public.videos, public.preguntas, public.ejecuciones_agentes from authenticated;
```

Además, guarda el esquema actual en el repo como base (`supabase db dump --schema public` → `supabase/migrations/20260925000000_esquema_base.sql`), para que tablas, políticas y `es_permitido()` estén versionadas.

**Hecho cuando:** en el panel se puede entrar, contestar una pregunta, descartar y deshacer igual que antes; `information_schema.role_table_grants` ya no muestra nada para `anon`; el esquema base está en el repo.

---

## FASE 1 — Que el panel no mienta — `D:\automatizaciones\scripts\sync_panel.py`

### T1.1 · Pregunta reescrita = pregunta nueva
Hoy el upsert usa `(video_id, clave)`. Si el guionista reescribe P1, la nueva P1 hereda la respuesta vieja y sale como «recogida» (caso real: GE_005).
1. Antes del upsert, lee de Supabase `clave, texto` de las preguntas de ese vídeo.
2. Si el `texto` nuevo es distinto del guardado (compáralo normalizando espacios), añade al upsert `respuesta = None, respondida_en = None, recogida_en = None`.
3. Si una `clave` ya no existe en `preguntas.md`, borra esa fila de Supabase.
4. **Arreglo puntual:** pasa esta lógica una vez por todos los vídeos abiertos y lista qué preguntas se han reiniciado (GE_005 debería salir).

**Hecho cuando:** cambias el texto de una pregunta respondida en un `preguntas.md` de prueba, corres el sync y en el panel sale como «Pendiente» y vacía.

### T1.2 · Recoger sin duplicar
En `escribir_respuestas`, si ya hay respuesta se añade una marca «(móvil)» en vez de reconocer que es la misma, así que un reintento la duplica.
- Antes de escribir, si el texto exacto de la respuesta ya está en esa pregunta del `.md`, no escribas nada y pasa directamente a confirmar.

**Hecho cuando:** ejecutar dos veces seguidas la recogida de la misma respuesta deja una sola copia en `preguntas.md`.

### T1.3 · Confirmar solo lo que se ha leído
Si Jordi cambia la respuesta mientras el sync recoge la anterior, hoy se marca como recogida la nueva sin haberla escrito.
- Guarda el `respondida_en` que leíste y confirma con:
  ```python
  supabase.table("preguntas").update({"recogida_en": ahora}) \
      .eq("id", id).eq("respondida_en", respondida_en_leida).is_("recogida_en", "null").execute()
  ```
- Si la actualización toca 0 filas, no hagas nada: la respuesta nueva se recoge en el siguiente ciclo (y T1.2 evita el duplicado).

**Hecho cuando:** simulas «leer A → Jordi guarda B → confirmar» y B sigue como «Enviada», no como «Recogida».

### T1.4 · Latido del sync
El panel calcula «datos del PC hace X» con el vídeo tocado más recientemente, así que no sabe si el sync va bien.

Migración `20260930_sync_estado.sql`:
```sql
create table public.sync_estado (
  id int primary key default 1 check (id = 1),
  ultimo_inicio timestamptz,
  ultimo_ok timestamptz,
  ultimo_error timestamptz,
  mensaje text
);
insert into public.sync_estado (id) values (1);
alter table public.sync_estado enable row level security;
create policy leer on public.sync_estado for select to authenticated using ((select public.es_permitido()));
grant select on public.sync_estado to authenticated;
```

En `sync_panel.py`, envuelve el ciclo entero:
- Al empezar: `ultimo_inicio = now`.
- Si termina bien: `ultimo_ok = now`, `mensaje = null`.
- Si falla: `ultimo_error = now`, `mensaje = <una frase legible, sin rutas ni trazas>`.
- Si el ciclo no arranca porque hay bloqueo de otro proceso, deja `mensaje = "Esperando: el coordinador está ocupado"`.

**Hecho cuando:** tras un ciclo normal `ultimo_ok` es de hace menos de 15 min; si desconectas la red, aparece `ultimo_error` con mensaje.

---

## FASE 2 — Integrar la rama nueva — `panel-jordi`

Rama base: `claude/app-architecture-refactor-juh476`. Rebasa primero sobre `main` (que ya tendrá T0.1).

### T2.1 · Arreglar `lib/pasos.ts` + tests
Errores comprobados:
- Un vídeo `archivado` genera «Grabado y subido», «Montaje revisado» y «Aprobado, falta publicarlo».
- Un guion en `borrador` pasa a «Guion listo» en cuanto no quedan preguntas sin contestar.

Reglas nuevas:
1. Si el estado es `archivado` (o está descartado): **un único paso** «Archivado», sin inventar nada.
2. El paso Guion solo es «Guion listo» si `ficha.estadoGuion === "listo"`. Si está en `borrador`, se queda en «Guion en borrador · lo cierra el guionista», tenga o no respuestas.
3. Preguntas, en tres estados distintos: `tuyo` si hay sin contestar; `sistema` «Enviadas · esperando al PC» si hay enviadas no recogidas; `hecho` solo si todas están recogidas.
4. Paso Publicar con `fase === "hecho"`: solo di «Aprobado, falta publicarlo» si el estado es `aprobado` o `exportado`.

Tests: añade `vitest` (solo dev) y `lib/pasos.test.ts` con, como mínimo, estos casos:
- archivado → 1 paso;
- borrador + 0 sin contestar + 2 enviadas → guion en borrador y preguntas «esperando al PC»;
- listo + todas recogidas → preguntas hecho;
- revision_jordi → paso revisar `tuyo`;
- publicado → todo hecho.

Script: `"test": "vitest run"`.

**Hecho cuando:** `npm test` pasa y la ficha de un vídeo archivado solo muestra «Archivado».

### T2.2 · Esconder lo que aún no funciona
Descartar y Pedir guion escriben en `peticiones`, pero el PC todavía no las procesa, así que el panel oculta un proyecto en el que los agentes siguen trabajando.
- Crea `lib/funciones.ts` con `export const PETICIONES_ACTIVAS = false;`.
- Con `false`: no se muestran «¿Este no?», el botón «+ Guion», la sección «Guiones que has pedido» ni la ruta `/nuevo` (que devuelva `notFound()`).
- No borres el código: se activa en la T3.1.

**Hecho cuando:** no hay en la app ninguna forma de crear una petición.

### T2.3 · Latido en pantalla
- Nuevo `lib/datos/sync.ts` → `estadoSync()` lee `sync_estado`.
- En el subtítulo de Proyectos y en Más, sustituye `ultimaSincronizacion(...)` por:
  - «PC ✓ hace X» si `ultimo_ok` es de hace menos de 30 min;
  - «PC ✗ sin respuesta desde HH:MM · <mensaje>» en tono `mal` en cualquier otro caso.
- Borra todas las frases «menos de 15 min» (portada, `FormPregunta`, `pasos.ts`, `mas`). Las respuestas enviadas dicen: «Guardada. Pendiente de que la recoja el PC».

**Hecho cuando:** si paras el sync 30 min, el panel lo dice en rojo.

### T2.4 · Limpieza
- Quita «Piezas de la app» de Más. La ruta `/piezas` puede quedarse, pero sin enlace.
- Contraste: el naranja de texto pequeño `#D9560B` baja a `#B04506` (o equivalente ≥ 4,5:1 sobre el fondo claro). En modo oscuro, comprueba que sigue legible.

### T2.5 · Integrar y comprobar en el móvil
Merge a `main`, despliegue, y Jordi comprueba en el móvil:
1. Portada: se ve el latido del PC.
2. Contestar una pregunta → «Guardada · pendiente» → tras el sync, «Recogida».
3. Un vídeo archivado no inventa pasos.
4. Con Supabase caído (cambia una variable en preview) sale «Algo ha fallado» y no «Nada pendiente».

---

## FASE 3 — Que te avise y cierre el circuito

### T3.1 · El PC procesa las peticiones
Migración: añade a `peticiones` las columnas `estado text not null default 'pendiente' check (estado in ('pendiente','procesando','hecha','fallida'))`, `error text` y `procesada_en timestamptz`. Amplía el `check` de `tipo` a `('descartar','nuevo','aprobar','cambios','corregir')` y añade `pregunta_id uuid` (para `corregir`).

En `sync_panel.py`, **antes de subir vídeos**:
- Lee las pendientes y marca `recogida_en` + `estado = 'procesando'`.
- `descartar`: para los agentes en ese proyecto, mueve la carpeta a `archivo/descartados/`, guarda motivo y nota en su historial y sube el vídeo como `archivado`.
- `nuevo`: crea el encargo para el guionista con texto y fecha.
- Al acabar: `estado = 'hecha'`, o `'fallida'` + `error` en una frase.

En el panel: pon `PETICIONES_ACTIVAS = true` y muestra el estado real («esperando al PC» / «hecho» / «falló: …»).

**Hecho cuando:** descartar desde el móvil → en el siguiente ciclo la carpeta está en `archivo/descartados/`, ningún agente la toca y el panel dice «hecho».

### T3.2 · Avisos — ⚠️ DECISIÓN DE JORDI: canal (Telegram o correo)
Los envía el propio sync, sin crear otra tarea programada. Casos:
- **Preguntas nuevas:** un aviso por vídeo cuando aparecen preguntas pendientes nuevas. Texto: «GE_0XX · 3 preguntas» + enlace `https://panel-jordi.vercel.app/videos/GE_0XX#preguntas`.
- **Montaje listo:** cuando `por_revisar` pasa de false a true. Enlace a la ficha.
- **Sync caído:** si `ultimo_ok` tiene más de 2 h (un aviso, no uno por ciclo).
- **Resumen diario** a las 8:00, solo si hay algo tuyo pendiente: lista corta con enlaces.

Guarda en local qué se ha avisado ya (archivo `avisos_enviados.json` con clave evento + id), para no repetir nunca.

**Hecho cuando:** añadir una pregunta en local produce un único aviso con el enlace correcto, y al volver a correr el sync no se repite.

### T3.3 · Revisar el montaje dentro del panel
- Migración: `videos.montaje_url text`.
- El sync la rellena con el enlace compartido de Drive del **último** export (solo el vigente; los anteriores no se suben).
- En la ficha, cuando toque revisar:
  - botón grande «Ver montaje» (abre `montaje_url`);
  - «Aprobar» → petición `aprobar`;
  - «Pedir cambios» + caja de texto → petición `cambios`.
- El sync procesa `aprobar` (estado `aprobado`) y `cambios` (pasa el texto al montador y quita `por_revisar`).
- Se elimina el enlace de búsqueda en Gmail (`correoMontaje`).

**Hecho cuando:** Jordi revisa y aprueba un montaje sin abrir Gmail.

---

## FASE 4 — Comodidad (según vayan molestando)

- **T4.1 · Portada:** «Me toca» por defecto; orden: grabar hoy/mañana → preguntas → revisar montaje → resto.
- **T4.2 · Respuestas de un toque:** el guionista puede poner `opciones: Sí | No | Depende` bajo una pregunta en `preguntas.md`; el sync lo sube a `preguntas.opciones text[]` y el panel lo muestra como botones. Siempre hay además «No lo sé, sigue sin esto», que envía `NO_SE` (el guionista debe saber tratarlo). Actualiza la skill `guion-elsa` con el formato.
- **T4.3 · Corregir una respuesta ya recogida:** botón «Corregir» → petición `corregir` con `pregunta_id` y texto nuevo; el sync sustituye la respuesta en `preguntas.md`.
- **T4.4 · Borrador local:** guarda en `localStorage` lo que escribes, por `pregunta.id` + hash del texto de la pregunta; se borra al enviar.
- **T4.5 · Ficha como columnas:** el sync sube `hora, franja, lugar, camion, trabajo, version, estado_guion` como columnas de `videos`; `listarProyectos()` deja de pedir `guion_md`.
- **T4.6 · Subir material desde el móvil:** carpeta de Drive que el archivador vigila; el paso «Subir lo grabado» lleva un botón que la abre. No se construye subida dentro de la app.

## NO hacer (de momento)

Modo sin conexión · dos columnas en escritorio · historial completo de versiones de preguntas · CI y protección de ramas · varios usuarios · meter la parte de salud en el panel.

## Encontrado por el camino

(Claude Code apunta aquí lo que vea fuera de alcance.)

- **30-09 · Tablas nuevas nacen con todo concedido.** Los privilegios por defecto de `public` (de `postgres` y `supabase_admin`) conceden `arwdDxtm` a `anon` y `authenticated` en cada tabla nueva. La T1.4 (`sync_estado`) y cualquier tabla futura saldrán con todo para `anon` salvo que la migración haga `revoke all … from anon, authenticated` antes del `grant`. Arreglo de raíz (tarea aparte): `alter default privileges in schema public revoke all on tables from anon, authenticated;` para ambos dueños.
- **30-09 · El PR #1 (refactor) se fusionó en `main` antes de la FASE 2.** Producción ya lleva `lib/pasos.ts` con los fallos de la T2.1 y los botones de peticiones que la T2.2 quiere esconder. La FASE 2 ya no necesita rebase; se trabaja sobre `main`.
- **30-09 · `main` local de `D:\panel-jordi` tiene cambios sin commitear** (service worker, `offline.html`, `registrar-sw.tsx`, `layout`, `manifest`, `next.config`, `proxy`). Es modo sin conexión, que está en «NO hacer». Además, esa copia está por detrás de `origin/main` (le faltan la fusión y la T0.2): hay que decidir qué se hace con esos cambios antes de hacer `pull`.
- **30-09 · Esquema base:** en vez de un `db dump` en `20260925000000_esquema_base.sql`, se guardaron las migraciones reales (`20260925064957_esquema_panel`, `20260925151411_videos_fecha_trabajo`) copiadas de `supabase_migrations.schema_migrations`, para no duplicar `peticiones` ni `fecha_trabajo` al reconstruir. Decidido por Jordi.
