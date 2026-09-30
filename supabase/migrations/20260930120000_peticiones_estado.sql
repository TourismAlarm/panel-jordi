-- T3.1 · El PC procesa las peticiones: estado real, error y más tipos.
-- (tabla vacía al escribir esto: no hace falta rellenar filas viejas)

alter table public.peticiones
  add column estado text not null default 'pendiente'
    check (estado in ('pendiente', 'procesando', 'hecha', 'fallida')),
  add column error text,
  add column procesada_en timestamptz,
  add column pregunta_id uuid;   -- para 'corregir' (T4.3)

-- Amplía los tipos: el check de tipo es anónimo, se busca su nombre y se sustituye.
do $$
declare n text;
begin
  select conname into n from pg_constraint
   where conrelid = 'public.peticiones'::regclass and contype = 'c'
     and pg_get_constraintdef(oid) like '%tipo = ANY%';
  execute format('alter table public.peticiones drop constraint %I', n);
end $$;

alter table public.peticiones
  add constraint peticiones_tipo_check
  check (tipo in ('descartar', 'nuevo', 'aprobar', 'cambios', 'corregir'));

-- Las pendientes del PC ahora se buscan por estado, no solo por recogida_en.
create index peticiones_por_estado on public.peticiones (creada_en) where estado in ('pendiente', 'procesando');

-- La app sigue sin poder elegir estado/error/procesada_en (los escribe el PC con service_role);
-- solo se le suma pregunta_id al insert.
grant insert (pregunta_id) on public.peticiones to authenticated;
