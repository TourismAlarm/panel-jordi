-- T1.4 · Latido del sync: una sola fila que el sync del PC actualiza en cada ciclo (service_role) y el panel lee.
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

-- Las tablas nuevas nacen con todo concedido a anon y authenticated: se quita antes de dar solo lectura.
revoke all on public.sync_estado from anon, authenticated;
grant select on public.sync_estado to authenticated;
