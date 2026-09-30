-- Aplicada en Supabase «Panel-jordi» el 25-09-2026. Copiada tal cual de supabase_migrations.schema_migrations.
-- Esquema base: tablas, RLS, políticas y es_permitido().
create table public.permitidos (user_id uuid primary key references auth.users on delete cascade);

create function public.es_permitido() returns boolean
  language sql stable security definer set search_path = '' as
  $$ select exists (select 1 from public.permitidos where user_id = (select auth.uid())) $$;

create table public.videos (
  id              text primary key,
  titulo          text,
  estado          text not null,
  siguiente_paso  text,
  por_revisar     boolean not null default false,
  guion_md        text,
  actualizado_en  timestamptz not null default now()
);

create table public.preguntas (
  id             uuid primary key default gen_random_uuid(),
  video_id       text not null references public.videos(id) on delete cascade,
  clave          text not null,
  orden          int  not null,
  texto          text not null,
  respuesta      text,
  respondida_en  timestamptz,
  recogida_en    timestamptz,
  unique (video_id, clave)
);

create table public.ejecuciones_agentes (
  id         bigint generated always as identity primary key,
  origen_id  text unique not null,
  agente     text not null,
  video_id   text references public.videos(id) on delete set null,
  inicio     timestamptz,
  fin        timestamptz,
  resultado  text,
  resumen    text
);
create index on public.ejecuciones_agentes (video_id);

alter table public.videos              enable row level security;
alter table public.preguntas           enable row level security;
alter table public.ejecuciones_agentes enable row level security;
alter table public.permitidos          enable row level security;

create policy leer on public.videos              for select to authenticated using ((select public.es_permitido()));
create policy leer on public.preguntas           for select to authenticated using ((select public.es_permitido()));
create policy leer on public.ejecuciones_agentes for select to authenticated using ((select public.es_permitido()));
create policy responder on public.preguntas for update to authenticated
  using ((select public.es_permitido()) and recogida_en is null)
  with check ((select public.es_permitido()));

-- La app (anon/authenticated) no inserta, borra ni actualiza nada salvo respuesta y respondida_en
revoke insert, update, delete, truncate on public.videos, public.preguntas, public.ejecuciones_agentes, public.permitidos from anon, authenticated;
revoke all on public.permitidos from anon, authenticated;
grant update (respuesta, respondida_en) on public.preguntas to authenticated;
revoke execute on function public.es_permitido() from public, anon;
grant execute on function public.es_permitido() to authenticated;
