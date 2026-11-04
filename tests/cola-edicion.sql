-- Prueba de la cola de edición contra la base real. Termina en error a propósito: no deja nada.
-- Si todo va bien, el único error es PRUEBA_COMPLETA_OK. Se lanza a mano porque los encargos no se borran.
begin;

insert into public.videos (id, titulo, estado, origen) values
  ('GE_9901', 'Prueba', 'guion_listo_falta_material', 'panel'),
  ('GE_9902', 'Prueba 2', 'guion_listo_falta_material', 'panel');

do $$
declare
  a jsonb;
  b jsonb;
  t public.encargos_edicion;
  n integer;
begin
  -- crear: versión 1, reglas copiadas, vídeo en montando
  a := public.crear_encargo('GE_9901', null, 'corte', '[]', '', '{"audio":"voz"}', '', 'antonio');
  assert (a->>'version')::int = 1, 'versión mal';
  assert (select estado from public.videos where id = 'GE_9901') = 'montando', 'el vídeo no pasa a montando';
  assert jsonb_array_length((select reglas from public.encargos_edicion where id = (a->>'id')::uuid)) > 0, 'sin reglas';

  -- otro abierto sin reemplaza_id: no
  begin
    perform public.crear_encargo('GE_9901', null, 'corte', '[]', '', '{}', '', 'antonio');
    assert false, 'dos abiertos';
  exception when raise_exception then null;
  end;
  begin
    perform public.crear_encargo('GE_0000', null, 'corte', '[]', '', '{}', '', 'antonio');
    assert false, 'vídeo inventado';
  exception when no_data_found then null;
  end;

  -- tomar: el más antiguo; después otro vídeo; después nada
  b := public.crear_encargo('GE_9902', null, 'acabado', '[]', '', '{}', '', 'antonio');
  update public.encargos_edicion set creado = now() - interval '1 hour' where id = (a->>'id')::uuid;   -- en una transacción now() no avanza
  select * into t from public.tomar_encargo();
  assert t.id = (a->>'id')::uuid and t.estado = 'en_curso' and t.tomado_en is not null, 'no toma el más antiguo';
  select * into t from public.tomar_encargo();
  assert t.id = (b->>'id')::uuid, 'no toma el segundo';
  select count(*) into n from public.tomar_encargo();
  assert n = 0, 'toma de más';

  -- uno en curso por vídeo: no se reemplaza ni se duplica
  begin
    perform public.crear_encargo('GE_9901', (a->>'id')::uuid, 'corte', '[]', '', '{}', 'x', 'antonio');
    assert false, 'reemplaza uno en curso';
  exception when raise_exception then null;
  end;
  begin
    insert into public.encargos_edicion (video_id, version, fase, estado, instrucciones, creado_por) values ('GE_9901', 9, 'corte', 'en_curso', '{}', 'antonio');
    assert false, 'dos en curso en un vídeo';
  exception when unique_violation then null;
  end;

  -- entregado y revisado con cambios → versión 2, la anterior sustituida
  update public.encargos_edicion set estado = 'listo', resultado_url = 'https://x' where id = (a->>'id')::uuid;
  perform public.encargo_revisado('GE_9901', 'corte', 'cambios');
  assert (select estado from public.encargos_edicion where id = (a->>'id')::uuid) = 'cambios', 'revisión con cambios mal';
  a := public.crear_encargo('GE_9901', (a->>'id')::uuid, 'corte', '[]', '', '{}', 'más corto', 'antonio');
  assert (a->>'version')::int = 2, 'versión 2 mal';
  assert (select count(*) from public.encargos_edicion where video_id = 'GE_9901' and estado = 'sustituido') = 1, 'la anterior no queda sustituida';

  -- un encargo que lleva 4 h en curso pasa a fallido al tomar
  update public.encargos_edicion set tomado_en = now() - interval '5 hours' where id = (b->>'id')::uuid;
  perform public.tomar_encargo();
  assert (select estado from public.encargos_edicion where id = (b->>'id')::uuid) = 'fallido', 'el colgado no falla';

  -- acabado revisado ok → le toca a Jordi
  update public.encargos_edicion set estado = 'listo', resultado_url = 'https://y', error = null where id = (b->>'id')::uuid;
  perform public.encargo_revisado('GE_9902', 'acabado', 'ok');
  assert (select estado || '|' || por_revisar || '|' || montaje_url from public.videos where id = 'GE_9902') = 'acabado_listo|true|https://y', 'el acabado no le llega a Jordi';
  assert (select estado from public.encargos_edicion where id = (b->>'id')::uuid) = 'listo', 'el encargo debe seguir listo';
end $$;

select set_config('request.jwt.claims', json_build_object('sub', (select user_id from public.permitidos limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
begin
  -- sin encargo por decidir → camino antiguo
  assert not public.decidir_encargo('GE_044', 'aprobar', '', false), 'decide sin encargo';
  -- pedir cambios: al momento y, con «siempre», regla nueva
  assert public.decidir_encargo('GE_9902', 'cambios', 'Regla de prueba siempre', true), 'cambios falla';
  assert (select estado || '|' || por_revisar from public.videos where id = 'GE_9902') = 'correcciones|false', 'cambios no se aplica';
  assert exists (select 1 from public.reglas where regla = 'Regla de prueba siempre' and estado = 'activa' and agente = 'montador'), 'sin regla';
  assert not public.decidir_encargo('GE_9902', 'aprobar', '', false), 'decide dos veces';
  -- la sesión solo lee
  begin
    update public.encargos_edicion set estado = 'aprobado';
    assert false, 'authenticated escribe encargos';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.tomar_encargo();
    assert false, 'authenticated toma encargos';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;
do $$
begin
  begin
    delete from public.encargos_edicion;
    assert false, 'service_role borra encargos';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.decidir_encargo('GE_9902', 'aprobar', '', false);
    assert false, 'service_role pasa la puerta de Jordi';
  exception when raise_exception then null;
  end;
end $$;

reset role;
do $$ begin raise exception 'PRUEBA_COMPLETA_OK'; end $$;
rollback;
