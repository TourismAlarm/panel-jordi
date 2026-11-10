-- El arnés de Antonio (/antonio y /api/bots/arnes): lo que el panel no sabe por sí solo.
-- Las rutinas viven en Grok Bot y las tareas a medias solo las conoce Antonio: las escribe él (service_role, por la API)
-- y Jordi las lee. Lo demás (preguntas, peticiones, ediciones…) se calcula de las tablas de siempre: aquí no se duplica.

create table public.arnes_rutinas (
  id text primary key check (char_length(id) between 1 and 100), -- el id que usa Antonio en Grok Bot
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  horario text not null,                                          -- «cada día a las 7:30», tal como lo dice Antonio
  ultima_ejecucion timestamptz,
  resultado text check (resultado in ('ok', 'fallo', 'nada')),
  proxima timestamptz,
  nota text,
  actualizado timestamptz not null default now()
);

create table public.arnes_tareas (
  id text primary key check (char_length(id) between 1 and 100),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  agente text not null check (agente in ('antonio', 'guionista', 'editor', 'analista', 'ideas', 'dia', 'salud', 'documentos', 'finanzas', 'revisor')),
  estado text not null check (estado in ('en_curso', 'esperando_agente', 'esperando_jordi', 'hecha', 'cancelada')),
  paso_actual text,
  falta text,
  enlace text,
  empezada_en timestamptz not null default now(),                -- la primera vez que llega; el upsert no la toca
  actualizado_en timestamptz not null,
  cerrada_en timestamptz,                                         -- hecha o cancelada: sale de la vista
  constraint arnes_tareas_cerrada check ((estado in ('hecha', 'cancelada')) = (cerrada_en is not null))
);
create index arnes_tareas_abiertas on public.arnes_tareas (user_id, actualizado_en) where cerrada_en is null;

alter table public.arnes_rutinas enable row level security;
alter table public.arnes_tareas enable row level security;
create policy leer on public.arnes_rutinas for select to authenticated using ((select public.es_permitido()) and user_id = (select auth.uid()));
create policy leer on public.arnes_tareas for select to authenticated using ((select public.es_permitido()) and user_id = (select auth.uid()));
revoke all on public.arnes_rutinas from anon, authenticated;
revoke all on public.arnes_tareas from anon, authenticated;
grant select on public.arnes_rutinas to authenticated;
grant select on public.arnes_tareas to authenticated;
-- service_role (la API) escribe. Ninguna ruta borra: el delete queda solo para limpiar datos de prueba a mano.
grant select, insert, update, delete on public.arnes_rutinas to service_role;
grant select, insert, update, delete on public.arnes_tareas to service_role;

-- La memoria común también guarda skills (cómo se hace algo) y problemas (lo que falla y cómo se sortea),
-- para que cualquiera que llegue al arnés sepa lo mismo.
alter table public.memoria_comun drop constraint memoria_comun_tipo_check;
alter table public.memoria_comun add constraint memoria_comun_tipo_check
  check (tipo in ('hecho', 'preferencia', 'decision', 'skill', 'problema'));
