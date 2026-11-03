-- El panel crea los proyectos GE al momento y es el único que numera. El PC deja de numerar y no toca estos vídeos.

alter table public.videos add column origen text not null default 'pc' check (origen in ('pc', 'panel'));

-- Último número dado. Una fila por contador; el update bloquea la fila, así que dos aprobaciones a la vez no se pisan.
create table public.contadores (
  nombre text primary key,
  valor integer not null
);
alter table public.contadores enable row level security;
revoke all on public.contadores from anon, authenticated;
revoke delete, truncate on public.contadores from service_role;

-- 43 = lo último que ha usado el PC, contando archivados y legacy/ (`contenido.py siguiente` daba GE_044 el 3-11-2026).
insert into public.contadores (nombre, valor)
select 'ge', greatest(43, coalesce(max(substring(id from '^GE_(\d+)$')::integer), 0)) from public.videos;

create function public.siguiente_ge() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
  codigo text;
begin
  loop
    update public.contadores set valor = valor + 1 where nombre = 'ge' returning valor into n;
    if n is null then raise exception 'falta el contador ge'; end if;
    codigo := 'GE_' || lpad(n::text, 3, '0');
    exit when not exists (select 1 from public.videos where id = codigo);
  end loop;
  return codigo;
end;
$$;
revoke all on function public.siguiente_ge() from public, anon, authenticated;
grant execute on function public.siguiente_ge() to service_role;   -- la usa el PC con su clave

-- Guion aprobado → vídeo. Todo o nada: si falla, el guion sigue aprobado sin vídeo y se puede reintentar.
-- Con la sesión de Jordi: quien decide es la app, no hace falta la service_role.
create function public.crear_ge_de_guion(p_guion uuid, p_guion_md text) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  g record;
  codigo text;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  select titulo, estado, video_id into g from public.guiones_propuestos where id = p_guion for update;
  if not found then raise exception 'ese guion no existe'; end if;
  if g.video_id is not null then return g.video_id; end if;   -- reintento: ya estaba hecho
  if g.estado <> 'aprobado' then raise exception 'ese guion no está aprobado'; end if;

  codigo := public.siguiente_ge();
  insert into public.videos (id, titulo, estado, guion_md, origen)
  values (codigo, g.titulo, 'guion_listo_falta_material', p_guion_md, 'panel');
  update public.guiones_propuestos set video_id = codigo, actualizado = now() where id = p_guion;
  return codigo;
end;
$$;
revoke all on function public.crear_ge_de_guion(uuid, text) from public, anon;
grant execute on function public.crear_ge_de_guion(uuid, text) to authenticated;

-- «Ya lo he grabado»: el vídeo al momento y, para el historial, la petición ya hecha con todo lo que escribió Jordi.
create function public.crear_ge_urgencia(p_texto text, p_fecha date) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  codigo text;
  titulo text := left(btrim(split_part(btrim(p_texto), E'\n', 1)), 80);
  fecha date := coalesce(p_fecha, (now() at time zone 'Europe/Madrid')::date);
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  if titulo = '' then raise exception 'falta el texto'; end if;

  codigo := public.siguiente_ge();
  insert into public.videos (id, titulo, estado, fecha_trabajo, sin_guion, origen)
  values (codigo, titulo, 'esperando_material', fecha, true, 'panel');
  insert into public.peticiones (tipo, texto, fecha_trabajo, video_id, estado, recogida_en, procesada_en)
  values ('sin_guion', p_texto, fecha, codigo, 'hecha', now(), now());
  return codigo;
end;
$$;
revoke all on function public.crear_ge_urgencia(text, date) from public, anon;
grant execute on function public.crear_ge_urgencia(text, date) to authenticated;
