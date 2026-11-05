-- Prueba de 20261106100000_hoy_contexto.sql. Pasada en Panel-jordi el 5-11-2026, tras aplicar la migración con autorización de Jordi.
-- Se deshace sola: el único final bueno es la excepción PRUEBA_COMPLETA_OK.
do $$
declare
  dueno uuid;
  f date := date '2000-01-03';
  fila public.resumenes_diarios;
  fallo boolean;
begin
  select user_id into dueno from public.permitidos limit 1;
  delete from public.resumenes_diarios where user_id = dueno and fecha between date '2000-01-01' and date '2000-01-09';

  -- Contexto antes del resumen: la fila no aparenta tener resumen.
  perform public.hoy_publicar_contexto(dueno, f, '[{"titulo":"Cita"}]', null);
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.resumen is not null or fila.origen is not null or fila.generado_en is not null then raise exception 'contexto aparenta resumen'; end if;
  if fila.agenda_en is null or fila.correos_en is not null or fila.correos <> '[]' then raise exception 'bloques mal'; end if;

  -- Solo correo: la agenda y su hora siguen.
  perform public.hoy_publicar_contexto(dueno, f, null, '[]');
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.agenda <> '[{"titulo":"Cita"}]' or fila.correos_en is null then raise exception 'correo pisó la agenda'; end if;

  -- Ninguno de los dos: error.
  fallo := false;
  begin
    perform public.hoy_publicar_contexto(dueno, f, null, null);
  exception when invalid_parameter_value then fallo := true;
  end;
  if not fallo then raise exception 'acepta contexto vacío'; end if;

  -- El cron escribe sobre una fila solo de contexto y no toca el contexto.
  if not public.hoy_guardar_resumen_sencillo(dueno, f, 'sencillo', '[]', '{}', false) then raise exception 'cron no escribió'; end if;
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.origen <> 'cron' or fila.agenda <> '[{"titulo":"Cita"}]' or fila.agenda_en is null then raise exception 'cron tocó contexto'; end if;

  -- Sin forzar no repite; forzando sí, mientras no sea del bot.
  if public.hoy_guardar_resumen_sencillo(dueno, f, 'otro', '[]', '{}', false) then raise exception 'cron repitió'; end if;
  if not public.hoy_guardar_resumen_sencillo(dueno, f, 'forzado', '[]', '{}', true) then raise exception 'no forzó'; end if;

  -- El bot escribe (como hace la ruta): solo sus columnas.
  insert into public.resumenes_diarios as r (user_id, fecha, resumen, prioridades, origen, generado_en) values (dueno, f, 'del bot', '[]', 'bot', now())
  on conflict (user_id, fecha) do update set resumen = excluded.resumen, prioridades = excluded.prioridades, origen = excluded.origen, generado_en = excluded.generado_en;
  if public.hoy_guardar_resumen_sencillo(dueno, f, 'pisa', '[]', '{}', true) then raise exception 'pisó al bot forzando'; end if;
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.resumen <> 'del bot' or fila.agenda <> '[{"titulo":"Cita"}]' then raise exception 'resumen del bot o contexto perdidos'; end if;

  -- Contexto después del resumen: el resumen sigue.
  perform public.hoy_publicar_contexto(dueno, f, '[]', null);
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.resumen <> 'del bot' or fila.origen <> 'bot' or fila.agenda <> '[]' then raise exception 'contexto pisó el resumen'; end if;

  -- Otra fecha no se toca.
  perform public.hoy_publicar_contexto(dueno, f + 1, '[{"titulo":"Otra"}]', null);
  select * into fila from public.resumenes_diarios where user_id = dueno and fecha = f;
  if fila.agenda <> '[]' then raise exception 'una fecha tocó otra'; end if;

  -- Un resumen no puede quedar a medias, y el bloque tiene que ser una lista.
  fallo := false;
  begin
    update public.resumenes_diarios set origen = null where user_id = dueno and fecha = f;
  exception when check_violation then fallo := true;
  end;
  if not fallo then raise exception 'resumen sin origen'; end if;
  fallo := false;
  begin
    perform public.hoy_publicar_contexto(dueno, f, '{"no":"lista"}', null);
  exception when check_violation then fallo := true;
  end;
  if not fallo then raise exception 'agenda que no es lista'; end if;

  -- Solo el servidor puede llamar a las funciones.
  if has_function_privilege('authenticated', 'public.hoy_publicar_contexto(uuid, date, jsonb, jsonb)', 'execute') then raise exception 'la app publica contexto'; end if;
  if has_function_privilege('anon', 'public.hoy_guardar_resumen_sencillo(uuid, date, text, jsonb, jsonb, boolean)', 'execute') then raise exception 'anon guarda resumen'; end if;
  if not has_function_privilege('service_role', 'public.hoy_publicar_contexto(uuid, date, jsonb, jsonb)', 'execute') then raise exception 'el servidor no puede publicar'; end if;

  raise exception 'PRUEBA_COMPLETA_OK';
end $$;

-- Concurrencia (manual, dos sesiones contra una base de pruebas; NO ejecutado):
-- A: begin; select public.hoy_publicar_contexto('<user>', '2000-01-05', '[{"titulo":"A"}]', null);   -- sin commit
-- B: select public.hoy_publicar_contexto('<user>', '2000-01-05', null, '[{"de":"x","asunto":"B"}]'); -- espera a A
-- A: commit;  → B termina. Resultado esperado: agenda = A y correos = B.
-- A: begin; insert ... origen 'bot' ... on conflict do update ...;                                  -- resumen del bot, sin commit
-- B: select public.hoy_guardar_resumen_sencillo('<user>', '2000-01-05', 'cron', '[]', '{}', true);  -- espera a A
-- A: commit;  → B devuelve false y el resumen sigue siendo el del bot.
