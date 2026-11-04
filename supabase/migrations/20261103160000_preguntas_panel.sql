-- Las preguntas de un guion del panel pasan a ser preguntas de verdad del vídeo: se contestan en la ficha
-- y las recoge Antonio. Hasta ahora quedaban como texto en «Notas para grabar».

-- Cada guion que Antonio sustituye en un vídeo del panel se queda aquí. La app solo lee y nadie borra.
create table public.videos_guion_historial (
  id bigint generated always as identity primary key,
  video_id text not null references public.videos,
  guion_md text not null,
  quien text not null check (quien in ('antonio', 'ideas', 'guionista')),
  creado timestamptz not null default now()
);
create index videos_guion_historial_por_video on public.videos_guion_historial (video_id, creado desc);
alter table public.videos_guion_historial enable row level security;
create policy leer on public.videos_guion_historial for select to authenticated using ((select public.es_permitido()));
revoke all on public.videos_guion_historial from anon, authenticated;
grant select on public.videos_guion_historial to authenticated;
revoke update, delete, truncate on public.videos_guion_historial from service_role;

-- Es pregunta si lleva ¿ o ?: lo demás (avisos de seguridad…) sigue en las notas. Misma regla que esPregunta en lib/bots/guiones.ts.
create function public.preguntas_de_guion(p_video text, p_preguntas jsonb) returns void
language sql security definer set search_path = ''
as $$
  insert into public.preguntas (video_id, clave, orden, texto)
  select p_video, 'P' || n, n, t
  from (
    select t, (row_number() over (order by ord))::integer as n
    from jsonb_array_elements_text(p_preguntas) with ordinality as e(t, ord)
    where t ~ '[¿?]'
  ) q
  on conflict (video_id, clave) do nothing;
$$;
revoke all on function public.preguntas_de_guion(text, jsonb) from public, anon, authenticated, service_role;

-- Igual que antes, y además crea las preguntas en la misma transacción.
create or replace function public.crear_ge_de_guion(p_guion uuid, p_guion_md text) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  g record;
  codigo text;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  select titulo, estado, video_id, preguntas into g from public.guiones_propuestos where id = p_guion for update;
  if not found then raise exception 'ese guion no existe'; end if;
  if g.video_id is not null then return g.video_id; end if;   -- reintento: ya estaba hecho
  if g.estado <> 'aprobado' then raise exception 'ese guion no está aprobado'; end if;

  codigo := public.siguiente_ge();
  insert into public.videos (id, titulo, estado, guion_md, origen)
  values (codigo, g.titulo, 'guion_listo_falta_material', p_guion_md, 'panel');
  perform public.preguntas_de_guion(codigo, g.preguntas);
  update public.guiones_propuestos set video_id = codigo, actualizado = now() where id = p_guion;
  return codigo;
end;
$$;

-- Los vídeos ya creados: sus preguntas pasan a la ficha y salen de las notas. Lo que no es pregunta se queda.
select public.preguntas_de_guion(g.video_id, g.preguntas)
from public.guiones_propuestos g
join public.videos v on v.id = g.video_id
where v.origen = 'panel' and v.estado <> 'archivado';

with partes as (
  select id,
         split_part(guion_md, E'# Notas para Jordi\n', 1) as antes,
         split_part(guion_md, E'# Notas para Jordi\n', 2) as notas
  from public.videos
  where origen = 'panel' and estado <> 'archivado' and guion_md like E'%# Notas para Jordi\n%'
), limpias as (
  select id, antes, (select string_agg(l, E'\n') from regexp_split_to_table(notas, E'\n') as l where l <> '' and l !~ '[¿?]') as notas
  from partes
)
update public.videos v
set guion_md = case when l.notas is null then rtrim(l.antes, E'\n ') || E'\n' else l.antes || E'# Notas para Jordi\n\n' || l.notas || E'\n' end,
    actualizado_en = now()
from limpias l
where v.id = l.id;
