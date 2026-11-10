-- Montajes hechos fuera de la cola del PC (el Editor con Claude Code en el ordenador de Antonio) y cierre de encargos viejos.
-- Regla: cada hecho se escribe una vez. La entrega crea el encargo «listo» y el vídeo pasa a «Te toca revisar»;
-- la ficha, ELSA y el arnés lo recalculan solos, y «Corte OK / Aprobar / Pedir cambios» funcionan igual (decidir_encargo).

alter table public.encargos_edicion add column version_externa text check (char_length(version_externa) between 1 and 60);
create unique index encargos_version_externa on public.encargos_edicion (video_id, version_externa) where version_externa is not null;

-- «cerrado»: un encargo que ya no cuenta (obsoleto, hecho por otro camino). No es un fallo ni una versión.
alter table public.encargos_edicion drop constraint encargos_edicion_estado_check;
alter table public.encargos_edicion add constraint encargos_edicion_estado_check
  check (estado in ('pendiente', 'en_curso', 'listo', 'aprobado', 'cambios', 'sustituido', 'bloqueado', 'fallido', 'cerrado'));

-- Entrega un montaje hecho fuera de la cola. La misma versión otra vez actualiza la entrega mientras Jordi no haya decidido.
-- Errores: P0002 = el vídeo no existe (404); el resto, 409 con el mensaje.
create function public.entregar_montaje(
  p_video text, p_fase text, p_version text, p_url text, p_duracion numeric, p_notas text, p_quien text
) returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v public.videos;
  e public.encargos_edicion;
  nuevo boolean := false;
begin
  select * into v from public.videos where id = p_video for update;
  if not found then raise exception 'ese vídeo no existe' using errcode = 'P0002'; end if;
  if v.estado = 'archivado' then raise exception 'ese vídeo está archivado'; end if;
  if exists (select 1 from public.encargos_edicion where video_id = p_video and estado = 'en_curso') then
    raise exception 'el PC está montando este vídeo: espera a que termine o cierra su encargo';
  end if;

  select * into e from public.encargos_edicion where video_id = p_video and version_externa = p_version for update;
  if found then
    if e.estado <> 'listo' then raise exception 'esa versión ya está decidida (%)', e.estado; end if;
    if e.fase <> p_fase then raise exception 'esa versión es de la fase %', e.fase; end if;
    update public.encargos_edicion
    set resultado_url = p_url, duracion_real_s = p_duracion, resultado_notas = p_notas, terminado_en = now()
    where id = e.id returning * into e;
  else
    -- Lo que estaba abierto de este vídeo queda sustituido por esta entrega: solo hay un encargo abierto por vídeo.
    update public.encargos_edicion set estado = 'sustituido'
    where video_id = p_video and estado in ('pendiente', 'bloqueado', 'listo', 'cambios', 'fallido');
    insert into public.encargos_edicion (video_id, version, fase, estado, instrucciones, creado_por, version_externa,
                                         resultado_url, duracion_real_s, resultado_notas, tomado_en, terminado_en)
    values (p_video, coalesce((select max(version) from public.encargos_edicion where video_id = p_video), 0) + 1,
            p_fase, 'listo', '{"fuera_de_cola": true}'::jsonb, p_quien, p_version, p_url, p_duracion, p_notas, now(), now())
    returning * into e;
    nuevo := true;
  end if;

  update public.videos
  set estado = case when p_fase = 'corte' then 'corte_listo' else 'acabado_listo' end,
      por_revisar = true, montaje_url = p_url, siguiente_paso = null, actualizado_en = now()
  where id = p_video;
  return jsonb_build_object('id', e.id, 'version', e.version, 'nuevo', nuevo);
end;
$$;

revoke all on function public.entregar_montaje(text, text, text, text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.entregar_montaje(text, text, text, text, numeric, text, text) to service_role;

-- Rutinas en pausa: siguen en el arnés, pero no cuentan como saltadas.
alter table public.arnes_rutinas add column activa boolean not null default true;
