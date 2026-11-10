-- Lo que Antonio (o el bot de Finanzas) le dice a Jordi como haría un buen asesor: problemas, cosas a vigilar, consejos y lo que va bien.
-- Cada uno lleva una clave: volver a mandarla lo actualiza en vez de repetirlo. Jordi lo marca como visto; el bot lo retira cuando deja de ser cierto.
create table public.fin_consejos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  clave text not null check (char_length(clave) between 1 and 80),
  nivel text not null check (nivel in ('problema', 'ojo', 'consejo', 'bien')),
  titulo text not null check (char_length(titulo) between 1 and 120),
  detalle text not null check (char_length(detalle) between 1 and 1000),
  enlace text check (enlace is null or char_length(enlace) <= 1000),
  bot text not null default 'finanzas' check (bot in ('antonio', 'finanzas')),
  estado text not null default 'activo' check (estado in ('activo', 'visto', 'retirado')),
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (user_id, clave)
);
create index fin_consejos_activos on public.fin_consejos (user_id, estado);

-- Como las propuestas: RLS activado y sin políticas. Solo la toca el servidor (service_role), filtrando por user_id.
alter table public.fin_consejos enable row level security;
revoke all on public.fin_consejos from anon, authenticated;
grant select, insert, update, delete on public.fin_consejos to service_role;
