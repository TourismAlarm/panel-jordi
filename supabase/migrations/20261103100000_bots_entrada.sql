-- Entrada de los bots de Grok Bot (primer tramo): actividad, autoría en Bandeja y log de llamadas.
-- Los bots no tocan Supabase: escriben por /api/bots/* con su clave, y la ruta usa la service_role.

-- Cada ejecución de un bot. La app solo lee.
create table public.actividad_bots (
  id bigint generated always as identity primary key,
  bot text not null check (bot in ('antonio', 'ideas', 'guionista')),
  tarea text not null,
  inicio timestamptz not null,
  fin timestamptz,
  resultado text not null check (resultado in ('ok', 'fallo', 'nada')),
  nota text,
  enlace text,
  creado timestamptz not null default now()
);
create index actividad_bots_por_fecha on public.actividad_bots (inicio desc);

alter table public.actividad_bots enable row level security;
create policy leer on public.actividad_bots for select to authenticated using ((select public.es_permitido()));
revoke all on public.actividad_bots from anon, authenticated;
grant select on public.actividad_bots to authenticated;
grant select, insert on public.actividad_bots to service_role;

-- Log de cada llamada y base del límite por minuto. Solo la service_role.
create table public.bots_llamadas (
  id bigint generated always as identity primary key,
  bot text not null,
  metodo text not null,
  ruta text not null,
  estado integer not null,
  creado timestamptz not null default now()
);
create index bots_llamadas_por_bot on public.bots_llamadas (bot, creado desc);

alter table public.bots_llamadas enable row level security;
revoke all on public.bots_llamadas from anon, authenticated;
grant select, insert on public.bots_llamadas to service_role;

-- Quién dejó cada cosa en la Bandeja (null = una automatización del panel).
alter table public.bandeja add column origen_bot text check (origen_bot in ('antonio', 'ideas', 'guionista'));
