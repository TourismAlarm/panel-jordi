-- Aplicada en Supabase «Panel-jordi» el 05-10-2026.
-- Aprendizaje de los agentes con Jordi al mando:
--   reglas         → lo que los agentes proponen aprender (estado 'propuesta') y lo que ya aplican ('activa').
--                    Jordi solo decide desde el panel: si / no / quitar (+ texto si la quiere cambiada).
--                    El PC (sync_panel.py, service_role) recoge la decisión, escribe sistema/aprendido/<agente>.md
--                    y cambia el estado. El .md del PC manda: lo que no esté allí no está activo.
--   peticiones.siempre → en «Pedir cambios», la casilla «hazlo siempre así»: además de corregir este montaje,
--                    el PC lo guarda al momento como regla activa del montador.
--   windsor_fotos  → una foto diaria de Instagram (Windsor) tomada en la nube, para medir aunque el PC esté apagado.

create table public.reglas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,                  -- R0001…: la pone el PC, es el id de la línea en sistema/aprendido/
  agente text not null check (agente in ('guionista', 'archivador', 'observador', 'montador', 'analista', 'coordinador')),
  regla text not null,
  evidencia text,                              -- de dónde sale (GE y corrección concreta, datos del analista…)
  medida text,                                 -- cómo sabremos si funciona
  origen text not null default 'retro' check (origen in ('retro', 'analista', 'correccion', 'manual')),
  estado text not null default 'propuesta' check (estado in ('propuesta', 'activa', 'rechazada', 'quitada')),
  decision text check (decision in ('si', 'no', 'quitar')),
  decision_texto text,                         -- «sí, pero así: …»
  decidida_en timestamptz,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

comment on table public.reglas is 'Reglas de los agentes. Jordi decide en el panel (decision); el PC aplica y cambia estado.';
create index reglas_por_decidir on public.reglas (creada_en) where decision is not null and estado in ('propuesta', 'activa');

alter table public.reglas enable row level security;

create policy leer on public.reglas
  for select to authenticated using ((select public.es_permitido()));

-- Decidir (o deshacer la decisión) solo sobre propuestas y activas; rechazadas y quitadas son historial.
create policy decidir on public.reglas
  for update to authenticated
  using ((select public.es_permitido()) and estado in ('propuesta', 'activa'))
  with check ((select public.es_permitido()) and estado in ('propuesta', 'activa'));

revoke all on public.reglas from anon, authenticated;
grant select on public.reglas to authenticated;
grant update (decision, decision_texto, decidida_en) on public.reglas to authenticated;

-- «Hazlo siempre así» al pedir cambios
alter table public.peticiones add column siempre boolean not null default false;
grant insert (siempre) on public.peticiones to authenticated;

-- Fotos diarias de Windsor (solo las escribe la tarea en la nube y las lee el PC; la app no las ve)
create table public.windsor_fotos (
  fecha date primary key,                      -- día (Madrid) en que se tomó
  tomada_en timestamptz not null default now(),
  datos jsonb not null                         -- lista de reels tal como la da Windsor
);
alter table public.windsor_fotos enable row level security;
revoke all on public.windsor_fotos from anon, authenticated;
