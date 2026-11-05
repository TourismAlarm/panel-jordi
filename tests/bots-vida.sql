-- Prueba de la migración de los bots de vida. Se deshace sola: el único final bueno es la excepción PRUEBA_COMPLETA_OK.
do $$
declare
  dueno uuid;
  fallo boolean;
begin
  select user_id into dueno from public.permitidos limit 1;

  -- Los bots nuevos firman; un nombre inventado, no.
  insert into public.actividad_bots (bot, tarea, inicio, resultado) values ('finanzas', 'prueba', now(), 'ok');
  insert into public.bandeja (user_id, modulo, tipo, titulo, origen_bot) values (dueno, 'salud', 'aviso', 'prueba', 'salud');
  fallo := false;
  begin
    insert into public.actividad_bots (bot, tarea, inicio, resultado) values ('otro', 'prueba', now(), 'ok');
  exception when check_violation then fallo := true;
  end;
  if not fallo then raise exception 'acepta un bot inventado'; end if;

  -- Salud no escribe en la memoria común.
  fallo := false;
  begin
    insert into public.memoria_comun (clave, contenido, tipo, autor) values ('prueba-salud', 'x', 'hecho', 'salud');
  exception when check_violation then fallo := true;
  end;
  if not fallo then raise exception 'salud puede escribir en la memoria'; end if;

  -- El resumen sabe quién lo escribió, y por defecto es el cron.
  delete from public.resumenes_diarios where user_id = dueno and fecha = date '2000-01-01';
  insert into public.resumenes_diarios (user_id, fecha, resumen, prioridades) values (dueno, date '2000-01-01', 'x', '[]');
  if (select origen from public.resumenes_diarios where user_id = dueno and fecha = date '2000-01-01') <> 'cron' then raise exception 'origen por defecto'; end if;

  -- Informes: solo de finanzas y salud.
  insert into public.informes_bots (user_id, bot, tipo, titulo, cuerpo_md) values (dueno, 'finanzas', 'mensual', 'x', 'x');
  fallo := false;
  begin
    insert into public.informes_bots (user_id, bot, tipo, titulo, cuerpo_md) values (dueno, 'dia', 'mensual', 'x', 'x');
  exception when check_violation then fallo := true;
  end;
  if not fallo then raise exception 'informe de un bot que no toca'; end if;

  -- Permisos: nadie de fuera ve los informes, la app solo lee y el servidor ni cambia ni borra.
  if has_table_privilege('anon', 'public.informes_bots', 'select') then raise exception 'anon lee informes'; end if;
  if has_table_privilege('authenticated', 'public.informes_bots', 'insert') then raise exception 'la app escribe informes'; end if;
  if has_table_privilege('service_role', 'public.informes_bots', 'update') then raise exception 'el servidor cambia informes'; end if;
  if has_table_privilege('service_role', 'public.informes_bots', 'delete') then raise exception 'el servidor borra informes'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.informes_bots'::regclass) then raise exception 'informes sin RLS'; end if;

  raise exception 'PRUEBA_COMPLETA_OK';
end $$;
