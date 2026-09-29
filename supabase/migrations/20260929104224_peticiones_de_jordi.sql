-- Aplicada en Supabase «Panel-jordi» el 29-09-2026. Copia para tenerla con el código.
-- Lo que Jordi pide desde el móvil y el PC recoge (mismo patrón que preguntas.recogida_en):
--   descartar → este proyecto fuera (motivo + nota)
--   nuevo     → hacer guion para otro trabajo (texto + fecha)
-- Sin clave foránea a videos a propósito: la petición sobrevive a cualquier forma de sincronizar.
create table public.peticiones (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('descartar', 'nuevo')),
  video_id text,
  motivo text check (motivo in ('no_lo_hice', 'no_me_gusta', 'no_sirve', 'otro')),
  texto text,
  fecha_trabajo date,
  creada_en timestamptz not null default now(),
  recogida_en timestamptz,
  constraint descartar_lleva_video check (tipo <> 'descartar' or video_id is not null),
  constraint nuevo_lleva_texto check (tipo <> 'nuevo' or coalesce(btrim(texto), '') <> '')
);

comment on table public.peticiones is 'Peticiones de Jordi desde el panel. El PC las recoge (recogida_en) y actúa.';

create unique index peticiones_un_descarte_pendiente on public.peticiones (video_id)
  where tipo = 'descartar' and recogida_en is null;
create index peticiones_pendientes on public.peticiones (creada_en) where recogida_en is null;

alter table public.peticiones enable row level security;

create policy leer on public.peticiones
  for select to authenticated using ((select public.es_permitido()));

create policy pedir on public.peticiones
  for insert to authenticated with check ((select public.es_permitido()) and recogida_en is null);

-- Deshacer: solo mientras el PC no la haya recogido.
create policy deshacer on public.peticiones
  for delete to authenticated using ((select public.es_permitido()) and recogida_en is null);
