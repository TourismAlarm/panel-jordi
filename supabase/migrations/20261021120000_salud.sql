-- Fase 3: módulo Salud (sal_*). Datos del reloj/PC en formato largo (una fila por día y métrica) + entrenos + registros manuales.
create table public.sal_metricas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  fecha date not null,
  metrica text not null,
  valor numeric not null,
  unidad text,
  fuente text not null default 'manual',
  actualizado_en timestamptz not null default now(),
  unique (user_id, fecha, metrica, fuente)
);
create index on public.sal_metricas (user_id, metrica, fecha desc);

create table public.sal_entrenos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  fecha date not null,
  tipo text not null,
  duracion_min numeric,
  distancia_km numeric,
  calorias numeric,
  fc_media numeric,
  fuente text not null default 'manual',
  id_externo text,
  actualizado_en timestamptz not null default now()
);
create unique index on public.sal_entrenos (user_id, fuente, id_externo) where id_externo is not null;
create index on public.sal_entrenos (user_id, fecha desc);

-- Lo que apuntas tú: síntomas, condiciones médicas y notas.
create table public.sal_registros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  creado_en timestamptz not null default now(),
  fecha date not null,
  tipo text not null check (tipo in ('sintoma', 'condicion', 'nota')),
  etiqueta text,
  texto text,
  intensidad int check (intensidad is null or intensidad between 1 and 5),
  aviso_medico boolean not null default false
);
create index on public.sal_registros (user_id, fecha desc);

alter table public.sal_metricas enable row level security;
alter table public.sal_entrenos enable row level security;
alter table public.sal_registros enable row level security;

-- Lectura: solo lo tuyo. El proceso del PC escribe por el servidor (service_role) con el endpoint de ingesta.
create policy leer on public.sal_metricas for select to authenticated using (user_id = (select auth.uid()) and (select public.es_permitido()));
create policy leer on public.sal_entrenos for select to authenticated using (user_id = (select auth.uid()) and (select public.es_permitido()));
-- Lo que apuntas a mano (peso, ánimo, energía) entra en sal_metricas con fuente «manual»
create policy manual_insertar on public.sal_metricas for insert to authenticated with check (user_id = (select auth.uid()) and (select public.es_permitido()) and fuente = 'manual');
create policy manual_actualizar on public.sal_metricas for update to authenticated using (user_id = (select auth.uid()) and (select public.es_permitido()) and fuente = 'manual') with check (user_id = (select auth.uid()) and (select public.es_permitido()) and fuente = 'manual');
create policy manual_borrar on public.sal_metricas for delete to authenticated using (user_id = (select auth.uid()) and (select public.es_permitido()) and fuente = 'manual');
create policy propio on public.sal_registros for all to authenticated using (user_id = (select auth.uid()) and (select public.es_permitido())) with check (user_id = (select auth.uid()) and (select public.es_permitido()));

revoke all on public.sal_metricas, public.sal_entrenos, public.sal_registros from anon;
revoke truncate, references, trigger on public.sal_metricas, public.sal_entrenos, public.sal_registros from authenticated;
revoke insert, update, delete on public.sal_entrenos from authenticated;
