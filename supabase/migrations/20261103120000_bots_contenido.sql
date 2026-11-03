-- Lo que producen los bots de Grok Bot: ideas, propuestas de guion, revisiones y memoria común.
-- Los bots escriben por /api/bots/* (service_role). La app lee todo y solo escribe decisiones (estado, nota_jordi).

create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  gancho text not null,
  formato text,
  por_que_funciona text,
  referencias jsonb not null default '[]',    -- lista de urls
  trabajo_sugerido text,
  fuente_bot text not null check (fuente_bot in ('antonio', 'ideas', 'guionista')),
  estado text not null default 'nueva' check (estado in ('nueva', 'me_gusta', 'descartada', 'usada')),
  nota_jordi text,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create unique index ideas_titulo_unico on public.ideas (lower(titulo));   -- reintentar la subida no duplica
create index ideas_por_estado on public.ideas (estado, creado desc);

create table public.guiones_propuestos (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid references public.ideas,
  evento_calendario text,                     -- de momento vacío: el calendario sigue siendo del guionista del PC
  titulo text not null,
  gancho text not null,
  planos jsonb not null default '[]',
  textos_pantalla jsonb not null default '[]', -- [{ texto exacto, segundo }]
  duracion_s integer,
  tema text,
  tipo_gancho text,
  prueba text,
  reglas_cumplidas jsonb not null default '[]',
  preguntas jsonb not null default '[]',
  estado text not null default 'propuesto' check (estado in ('propuesto', 'aprobado', 'cambios', 'descartado', 'sustituido')),
  nota_jordi text,                            -- qué cambiar, al «Pedir cambios»
  version integer not null default 1,
  reemplaza_id uuid references public.guiones_propuestos,
  video_id text references public.videos,     -- lo pondrá el PC al convertirlo en GE
  fuente_bot text not null check (fuente_bot in ('antonio', 'ideas', 'guionista')),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index guiones_por_estado on public.guiones_propuestos (estado, creado desc);

create table public.revisiones (
  id uuid primary key default gen_random_uuid(),
  video_id text references public.videos,
  guion_id uuid references public.guiones_propuestos,
  fase text not null check (fase in ('guion', 'corte', 'acabado')),
  bot text not null check (bot in ('antonio', 'ideas', 'guionista')),
  resultado text not null check (resultado in ('ok', 'cambios')),
  por_regla jsonb not null default '[]',      -- [{ clave, estado: cumple|no_cumple|no_aplica, evidencia }]
  resumen text,
  creado timestamptz not null default now(),
  constraint revisa_una_cosa check ((fase = 'guion' and guion_id is not null and video_id is null) or (fase <> 'guion' and video_id is not null and guion_id is null))
);
create index revisiones_por_video on public.revisiones (video_id, creado desc);
create index revisiones_por_guion on public.revisiones (guion_id, creado desc);

create table public.memoria_comun (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  contenido text not null,
  tipo text not null check (tipo in ('hecho', 'preferencia', 'decision')),
  autor text not null check (autor in ('antonio', 'ideas', 'guionista')),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

alter table public.ideas enable row level security;
alter table public.guiones_propuestos enable row level security;
alter table public.revisiones enable row level security;
alter table public.memoria_comun enable row level security;

create policy leer on public.ideas for select to authenticated using ((select public.es_permitido()));
create policy leer on public.guiones_propuestos for select to authenticated using ((select public.es_permitido()));
create policy leer on public.revisiones for select to authenticated using ((select public.es_permitido()));
create policy leer on public.memoria_comun for select to authenticated using ((select public.es_permitido()));

-- Decidir: una idea ya usada o un guion ya convertido en vídeo no se pueden cambiar desde la app.
create policy decidir on public.ideas for update to authenticated
  using ((select public.es_permitido()) and estado in ('nueva', 'me_gusta', 'descartada'))
  with check ((select public.es_permitido()) and estado in ('nueva', 'me_gusta', 'descartada'));
create policy decidir on public.guiones_propuestos for update to authenticated
  using ((select public.es_permitido()) and video_id is null and estado in ('propuesto', 'aprobado', 'cambios', 'descartado'))
  with check ((select public.es_permitido()) and video_id is null and estado in ('propuesto', 'aprobado', 'cambios', 'descartado'));

revoke all on public.ideas, public.guiones_propuestos, public.revisiones, public.memoria_comun from anon, authenticated;
grant select on public.ideas, public.guiones_propuestos, public.revisiones, public.memoria_comun to authenticated;
grant update (estado, nota_jordi, actualizado) on public.ideas, public.guiones_propuestos to authenticated;

-- Nada de borrar, tampoco con la service_role.
revoke delete, truncate on public.ideas, public.guiones_propuestos, public.revisiones, public.memoria_comun, public.actividad_bots, public.bots_llamadas from service_role;
