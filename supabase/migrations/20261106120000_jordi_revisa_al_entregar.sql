-- Jordi revisa en el panel en cuanto el PC entrega, sin esperar a que Antonio lo marque por la API (Jordi, 06-11-2026).
-- El corte y el acabado salen como «Te toca revisar» con el enlace de Drive. Antonio puede seguir revisando en paralelo.

-- Jordi decide sobre la última versión entregada de cualquier fase: corte (corte_ok / cambios) o acabado (aprobar / cambios).
create or replace function public.decidir_encargo(p_video text, p_tipo text, p_texto text, p_siempre boolean)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  e public.encargos_edicion;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  if p_tipo not in ('aprobar', 'cambios', 'corte_ok') then return false; end if;
  select * into e from public.encargos_edicion
  where video_id = p_video and estado = 'listo'
    and (p_tipo = 'cambios' or fase = case when p_tipo = 'corte_ok' then 'corte' else 'acabado' end)
  order by version desc limit 1
  for update;
  if not found then return false; end if;

  if p_tipo = 'aprobar' then
    update public.encargos_edicion set estado = 'aprobado', revisado_en = coalesce(revisado_en, now()) where id = e.id;
    update public.videos set estado = 'aprobado', por_revisar = false, siguiente_paso = 'Aprobado: el PC lo copia a FINAL', actualizado_en = now() where id = p_video;
  elsif p_tipo = 'corte_ok' then
    update public.encargos_edicion set estado = 'aprobado', revisado_en = coalesce(revisado_en, now()) where id = e.id;
    update public.videos set estado = 'acabado_pendiente', por_revisar = false, siguiente_paso = 'Corte OK: Antonio encarga el acabado', actualizado_en = now() where id = p_video;
  else
    update public.encargos_edicion set estado = 'cambios', revisado_en = coalesce(revisado_en, now()), decision_jordi = nullif(btrim(p_texto), '') where id = e.id;
    update public.videos set estado = 'correcciones', por_revisar = false, siguiente_paso = 'Has pedido cambios: Antonio prepara otra versión', actualizado_en = now() where id = p_video;
    if p_siempre and nullif(btrim(p_texto), '') is not null then
      perform public.regla_crear('montador', p_texto, p_video, '', 'Jordi: «hazlo siempre así»', 'jordi', 'correccion', 'activa');
    end if;
  end if;
  return true;
end;
$$;

-- La revisión de Antonio ya no da paso a Jordi (ya lo tiene). Acabado ok: solo apunta que lo vio y Jordi decide.
-- Corte ok: como antes, el corte queda aprobado y Antonio encarga el acabado. Cambios: sale de la lista de Jordi.
create or replace function public.encargo_revisado(p_video text, p_fase text, p_resultado text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  e public.encargos_edicion;
begin
  select * into e from public.encargos_edicion
  where video_id = p_video and fase = p_fase and estado = 'listo' and revisado_en is null
  order by version desc limit 1
  for update;
  if not found then return; end if;

  if p_resultado = 'cambios' then
    update public.encargos_edicion set revisado_en = now(), estado = 'cambios' where id = e.id;
    update public.videos set estado = 'correcciones', por_revisar = false, siguiente_paso = 'Antonio ha pedido cambios: habrá otra versión', actualizado_en = now() where id = p_video;
  elsif p_fase = 'corte' then
    update public.encargos_edicion set revisado_en = now(), estado = 'aprobado' where id = e.id;
    update public.videos set estado = 'acabado_pendiente', por_revisar = false, siguiente_paso = 'Corte visto por Antonio: falta el acabado', actualizado_en = now() where id = p_video;
  else
    update public.encargos_edicion set revisado_en = now() where id = e.id;
  end if;
end;
$$;

-- Lo que ya está entregado y nadie ha decidido (GE_031 v7): a la lista de Jordi.
update public.videos v
set estado = case e.fase when 'corte' then 'corte_listo' else 'acabado_listo' end,
    por_revisar = true, montaje_url = e.resultado_url, siguiente_paso = null, actualizado_en = now()
from (
  select distinct on (video_id) video_id, fase, resultado_url from public.encargos_edicion
  where estado = 'listo' order by video_id, version desc
) e
where v.id = e.video_id and e.resultado_url is not null;
