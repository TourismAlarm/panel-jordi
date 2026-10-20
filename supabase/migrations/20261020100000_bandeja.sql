-- Fase 1: bandeja común (avisos, preguntas y borradores que dejan las automatizaciones) + auditoría de RLS.
create table public.bandeja (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  modulo      text not null check (modulo in ('hoy', 'finanzas', 'salud', 'elsa', 'documentos', 'sistema')),
  tipo        text not null check (tipo in ('aviso', 'pregunta', 'borrador')),
  titulo      text not null,
  cuerpo      text,
  estado      text not null default 'nuevo' check (estado in ('nuevo', 'leido', 'respondido')),
  respuesta   text,
  created_at  timestamptz not null default now()
);
create index on public.bandeja (user_id, estado, created_at desc);

alter table public.bandeja enable row level security;

create policy leer on public.bandeja for select to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()));
create policy responder on public.bandeja for update to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()))
  with check (user_id = (select auth.uid()) and (select public.es_permitido()));

-- La app solo lee y cambia estado/respuesta. Crear filas lo hacen las automatizaciones con la service_role.
revoke all on public.bandeja from anon, authenticated;
grant select on public.bandeja to authenticated;
grant update (estado, respuesta) on public.bandeja to authenticated;

-- Para la prueba automática: tablas de public sin RLS (solo la service_role puede llamarla).
create function public.rls_auditoria() returns table (tabla text)
  language sql stable security definer set search_path = '' as
  $$ select c.relname::text from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity order by 1 $$;
revoke execute on function public.rls_auditoria() from public, anon, authenticated;
grant execute on function public.rls_auditoria() to service_role;
