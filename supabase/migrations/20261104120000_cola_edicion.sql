-- La cola de edición: lo único que hace el PC. Antonio encarga, el PC toma y entrega, Antonio revisa y Jordi aprueba.
-- La app solo lee; los bots escriben por /api/bots/edicion/*. Un vídeo con encargos es del panel: el sync del PC no le toca el estado.

create table public.encargos_edicion (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.videos,
  version integer not null,
  reemplaza_id uuid references public.encargos_edicion,
  fase text not null check (fase in ('corte', 'acabado')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_curso', 'listo', 'aprobado', 'cambios', 'sustituido', 'bloqueado', 'fallido')),
  brutos jsonb not null default '[]',
  guion_md text,
  instrucciones jsonb not null,
  reglas jsonb not null default '[]',          -- claves y texto en el momento del encargo
  feedback text,                               -- qué cambiar respecto a la versión anterior
  resultado_url text,
  resultado_notas text,
  preguntas jsonb not null default '[]',       -- [{texto, respuesta}]
  duracion_real_s numeric,
  final_url text,                              -- el FINAL en Drive, cuando Jordi lo ha aprobado
  revisado_en timestamptz,                     -- Antonio ya lo ha revisado
  decision_jordi text,                         -- lo que escribió Jordi al pedir cambios
  creado_por text not null,
  creado timestamptz not null default now(),
  tomado_en timestamptz,
  terminado_en timestamptz,
  error text,
  unique (video_id, version)
);
create unique index encargos_uno_en_curso_por_video on public.encargos_edicion (video_id) where estado = 'en_curso';
create index encargos_por_estado on public.encargos_edicion (estado, creado);
alter table public.encargos_edicion enable row level security;
create policy leer on public.encargos_edicion for select to authenticated using ((select public.es_permitido()));
revoke all on public.encargos_edicion from anon, authenticated;
grant select on public.encargos_edicion to authenticated;
revoke delete, truncate on public.encargos_edicion from service_role;

alter table public.actividad_bots drop constraint actividad_bots_bot_check;
alter table public.actividad_bots add constraint actividad_bots_bot_check check (bot in ('antonio', 'ideas', 'guionista', 'editor'));

-- Un encargo nuevo, o la versión siguiente de otro. El vídeo pasa a «montando». Los errores son 409 en la API; P0002 = no existe.
create function public.crear_encargo(
  p_video text, p_reemplaza uuid, p_fase text, p_brutos jsonb, p_guion_md text, p_instrucciones jsonb, p_feedback text, p_quien text
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  previo public.encargos_edicion;
  nuevo public.encargos_edicion;
  v public.videos;
begin
  select * into v from public.videos where id = p_video for update;   -- dos encargos a la vez no se llevan el mismo número
  if not found then raise exception 'ese vídeo no existe' using errcode = 'P0002'; end if;
  if v.estado = 'archivado' then raise exception 'ese vídeo está archivado'; end if;

  if p_reemplaza is not null then
    select * into previo from public.encargos_edicion where id = p_reemplaza and video_id = p_video for update;
    if not found then raise exception 'ese encargo no existe en este vídeo' using errcode = 'P0002'; end if;
    if previo.estado = 'en_curso' then raise exception 'el PC lo está montando: espera a que termine'; end if;
    if previo.estado = 'sustituido' then raise exception 'ese encargo ya está sustituido'; end if;
  elsif exists (select 1 from public.encargos_edicion where video_id = p_video and estado in ('pendiente', 'en_curso', 'bloqueado', 'listo', 'cambios', 'fallido')) then
    raise exception 'ya hay un encargo abierto de este vídeo: usa reemplaza_id';
  end if;

  insert into public.encargos_edicion (video_id, version, reemplaza_id, fase, brutos, guion_md, instrucciones, reglas, feedback, creado_por)
  select p_video,
    coalesce((select max(version) from public.encargos_edicion where video_id = p_video), 0) + 1,
    p_reemplaza, p_fase, p_brutos, p_guion_md, p_instrucciones,
    coalesce((select jsonb_agg(jsonb_build_object('clave', clave, 'regla', regla) order by clave) from public.reglas where agente = 'montador' and estado = 'activa'), '[]'),
    nullif(btrim(p_feedback), ''), p_quien
  returning * into nuevo;

  if p_reemplaza is not null then
    update public.encargos_edicion set estado = 'sustituido' where id = p_reemplaza;
  end if;
  update public.videos
  set estado = 'montando', por_revisar = false, siguiente_paso = 'En la cola de edición del PC', actualizado_en = now()
  where id = p_video;
  return jsonb_build_object('id', nuevo.id, 'version', nuevo.version);
end;
$$;
revoke all on function public.crear_encargo(text, uuid, text, jsonb, text, jsonb, text, text) from public, anon, authenticated;

-- El PC se lleva el más antiguo. Dos PC a la vez no toman el mismo. Uno que lleva 4 h en curso murió: pasa a fallido para que Antonio lo vea.
create function public.tomar_encargo() returns setof public.encargos_edicion
language plpgsql security definer set search_path = ''
as $$
declare
  e public.encargos_edicion;
begin
  update public.encargos_edicion
  set estado = 'fallido', error = 'El PC no terminó en 4 horas', terminado_en = now()
  where estado = 'en_curso' and tomado_en < now() - interval '4 hours';

  select * into e from public.encargos_edicion p
  where p.estado = 'pendiente'
    and not exists (select 1 from public.encargos_edicion o where o.video_id = p.video_id and o.estado = 'en_curso')
  order by p.creado, p.id
  for update skip locked
  limit 1;
  if not found then return; end if;

  update public.encargos_edicion set estado = 'en_curso', tomado_en = now() where id = e.id returning * into e;
  update public.videos set siguiente_paso = 'Montándose en el PC', actualizado_en = now() where id = e.video_id;
  return next e;
end;
$$;
revoke all on function public.tomar_encargo() from public, anon, authenticated;

-- La revisión de Antonio sobre lo entregado. Corte ok → hecho. Acabado ok → le toca a Jordi. Cambios → Antonio hará otra versión.
create function public.encargo_revisado(p_video text, p_fase text, p_resultado text) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  e public.encargos_edicion;
begin
  select * into e from public.encargos_edicion
  where video_id = p_video and fase = p_fase and estado = 'listo' and revisado_en is null
  order by version desc limit 1
  for update;
  if not found then return; end if;

  update public.encargos_edicion
  set revisado_en = now(),
      estado = case when p_resultado = 'cambios' then 'cambios' when p_fase = 'corte' then 'aprobado' else estado end
  where id = e.id;

  if p_resultado = 'ok' and p_fase = 'acabado' then
    update public.videos
    set estado = 'acabado_listo', por_revisar = true, montaje_url = e.resultado_url, siguiente_paso = null, actualizado_en = now()
    where id = p_video;
  else
    update public.videos
    set siguiente_paso = case when p_resultado = 'ok' then 'Corte visto por Antonio: falta el acabado' else 'Antonio ha pedido cambios: habrá otra versión' end,
        actualizado_en = now()
    where id = p_video;
  end if;
end;
$$;
revoke all on function public.encargo_revisado(text, text, text) from public, anon, authenticated;

-- Aprobar / Pedir cambios de Jordi: al momento, sin pasar por el PC. false = ese vídeo no tiene encargo por decidir (va por el camino antiguo).
create function public.decidir_encargo(p_video text, p_tipo text, p_texto text, p_siempre boolean) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  e public.encargos_edicion;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  if p_tipo not in ('aprobar', 'cambios') then return false; end if;
  select * into e from public.encargos_edicion
  where video_id = p_video and fase = 'acabado' and estado = 'listo' and revisado_en is not null
  order by version desc limit 1
  for update;
  if not found then return false; end if;

  if p_tipo = 'aprobar' then
    update public.encargos_edicion set estado = 'aprobado' where id = e.id;
    update public.videos set estado = 'aprobado', por_revisar = false, siguiente_paso = 'Aprobado: el PC lo copia a FINAL', actualizado_en = now() where id = p_video;
  else
    update public.encargos_edicion set estado = 'cambios', decision_jordi = nullif(btrim(p_texto), '') where id = e.id;
    update public.videos set estado = 'correcciones', por_revisar = false, siguiente_paso = 'Has pedido cambios: Antonio prepara otra versión', actualizado_en = now() where id = p_video;
    if p_siempre and nullif(btrim(p_texto), '') is not null then
      perform public.regla_crear('montador', p_texto, p_video, '', 'Jordi: «hazlo siempre así»', 'jordi', 'correccion', 'activa');
    end if;
  end if;
  return true;
end;
$$;
revoke all on function public.decidir_encargo(text, text, text, boolean) from public, anon;
grant execute on function public.decidir_encargo(text, text, text, boolean) to authenticated;
