-- Hoy sin Google: Antonio publica agenda y una selección de correo, y Día escribe el resumen.
-- Cada parte se escribe por separado sobre la misma fila (user_id, fecha) sin pisar las demás.

alter table public.resumenes_diarios
  add column agenda jsonb not null default '[]',
  add column correos jsonb not null default '[]',
  add column agenda_en timestamptz,
  add column correos_en timestamptz;

alter table public.resumenes_diarios
  add constraint resumenes_diarios_agenda_lista check (jsonb_typeof(agenda) = 'array'),
  add constraint resumenes_diarios_correos_lista check (jsonb_typeof(correos) = 'array');

-- Una fila puede tener solo contexto: sin resumen, ni quién lo escribió, ni cuándo.
alter table public.resumenes_diarios
  alter column resumen drop not null,
  alter column origen drop default,
  alter column origen drop not null,
  alter column generado_en drop default,
  alter column generado_en drop not null;
alter table public.resumenes_diarios
  add constraint resumenes_diarios_resumen_completo check (resumen is null or (origen is not null and generado_en is not null));

-- Publica agenda y/o correo. null = ese bloque no viene y no se toca; [] = revisado y vacío. Una sola sentencia: dos bloques a la vez no se pisan.
create function public.hoy_publicar_contexto(p_user uuid, p_fecha date, p_agenda jsonb, p_correos jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_agenda is null and p_correos is null then
    raise exception 'sin agenda ni correo' using errcode = '22023';
  end if;
  insert into public.resumenes_diarios as r (user_id, fecha, agenda, correos, agenda_en, correos_en)
  values (p_user, p_fecha, coalesce(p_agenda, '[]'::jsonb), coalesce(p_correos, '[]'::jsonb),
          case when p_agenda is not null then now() end, case when p_correos is not null then now() end)
  on conflict (user_id, fecha) do update set
    agenda = coalesce(p_agenda, r.agenda),
    agenda_en = case when p_agenda is null then r.agenda_en else now() end,
    correos = coalesce(p_correos, r.correos),
    correos_en = case when p_correos is null then r.correos_en else now() end;
end;
$$;

-- El resumen sencillo del panel (cron y botón si Antonio no responde). Nunca pisa el del bot, ni forzando; nunca toca agenda ni correo.
-- La condición va en el propio ON CONFLICT: se evalúa con la fila bloqueada, así que no hay carrera con el bot.
create function public.hoy_guardar_resumen_sencillo(p_user uuid, p_fecha date, p_resumen text, p_prioridades jsonb, p_senales jsonb, p_forzar boolean)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  escrito boolean;
begin
  insert into public.resumenes_diarios as r (user_id, fecha, resumen, prioridades, senales, origen, generado_en)
  values (p_user, p_fecha, p_resumen, p_prioridades, p_senales, 'cron', now())
  on conflict (user_id, fecha) do update set
    resumen = excluded.resumen,
    prioridades = excluded.prioridades,
    senales = excluded.senales,
    origen = 'cron',
    generado_en = now(),
    enviado_en = null,
    error_envio = null
  where r.resumen is null or (p_forzar and r.origen is distinct from 'bot')
  returning true into escrito;
  return coalesce(escrito, false);
end;
$$;

-- Solo el servidor. La app (authenticated) sigue pudiendo solo leer su fila.
revoke all on function public.hoy_publicar_contexto(uuid, date, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.hoy_guardar_resumen_sencillo(uuid, date, text, jsonb, jsonb, boolean) from public, anon, authenticated;
grant execute on function public.hoy_publicar_contexto(uuid, date, jsonb, jsonb) to service_role;
grant execute on function public.hoy_guardar_resumen_sencillo(uuid, date, text, jsonb, jsonb, boolean) to service_role;
