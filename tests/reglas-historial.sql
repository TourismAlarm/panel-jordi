-- Prueba de reglas_historial y del deshacer contra la base real. Termina en rollback: no deja nada.
-- Se lanza a mano porque el historial no se puede borrar. Si algo falla, la consulta da error.
begin;

do $$
declare
  c text;
  c2 text;
  v integer;
  fila public.reglas;
  n integer;
begin
  -- crear numera y deja rastro; repetir no duplica
  c := public.regla_crear('montador', 'Regla de prueba A', 'GE_000', null, 'porque sí', 'antonio');
  c2 := public.regla_crear('montador', '  regla de prueba a ', 'GE_000', null, 'reintento', 'antonio');
  assert c = c2, 'un reintento no devuelve la misma regla';
  select count(*) into n from public.reglas_historial where clave = c;
  assert n = 1, 'el reintento ha dejado historial';
  select * into fila from public.reglas where clave = c;
  assert fila.estado = 'activa' and fila.version = 1 and fila.actualizada_por = 'antonio', 'crear mal';

  -- editar guarda el texto anterior y sube la versión
  v := public.regla_editar(c, 'Regla de prueba B', 'mejor así', 'antonio');
  assert v = 2, 'editar no sube la versión';
  assert exists (select 1 from public.reglas_historial where clave = c and accion = 'editar' and texto_antes = 'Regla de prueba A' and texto_despues = 'Regla de prueba B' and por_que = 'mejor así'), 'editar sin rastro';

  -- retirar y crear el mismo texto la reactiva, sin número nuevo
  perform public.regla_retirar(c, 'ya no', 'antonio');
  assert (select estado from public.reglas where clave = c) = 'quitada', 'retirar mal';
  c2 := public.regla_crear('montador', 'Regla de prueba B', 'GE_000', '', 'vuelve', 'antonio');
  assert c = c2 and (select estado from public.reglas where clave = c) = 'activa', 'no se reactiva';
  assert exists (select 1 from public.reglas_historial where clave = c and accion = 'reactivar'), 'reactivar sin rastro';

  -- no se edita una retirada
  perform public.regla_retirar(c, 'otra vez', 'antonio');
  begin
    perform public.regla_editar(c, 'x', 'y', 'antonio');
    assert false, 'ha dejado editar una retirada';
  exception when raise_exception then null;
  end;
  begin
    perform public.regla_editar('R9999', 'x', 'y', 'antonio');
    assert false, 'ha dejado editar una que no existe';
  exception when no_data_found then null;
  end;

  -- numeración: dos seguidas no se repiten
  c2 := public.regla_crear('guionista', 'Regla de prueba C', null, null, 'p', 'antonio', 'antonio', 'propuesta');
  assert c2 <> c and (select estado from public.reglas where clave = c2) = 'propuesta', 'propuesta mal';
end $$;

-- Lo de Jordi: con su sesión. es_permitido() mira quién es en el token.
select set_config('request.jwt.claims', json_build_object('sub', (select user_id from public.permitidos limit 1), 'role', 'authenticated')::text, true);
set local role authenticated;

do $$
declare
  a uuid;
  p uuid;
begin
  select id into a from public.reglas where regla = 'Regla de prueba B';
  select id into p from public.reglas where regla = 'Regla de prueba C';

  -- deshacer: vuelve a como estaba antes del último cambio, y no se deshace dos veces
  assert public.regla_deshacer(a), 'deshacer falla';
  assert (select estado from public.reglas where id = a) = 'activa', 'deshacer no devuelve el estado';
  assert not public.regla_deshacer(a), 'ha deshecho un deshacer';

  -- sí con texto cambiado: al momento, y queda firmado por Jordi
  assert public.regla_decidir(p, 'si', 'Regla de prueba D'), 'el sí falla';
  assert (select estado || '|' || regla from public.reglas where id = p) = 'activa|Regla de prueba D', 'el sí no se aplica';
  assert exists (select 1 from public.reglas_historial where regla_id = p and quien = 'jordi' and texto_antes = 'Regla de prueba C'), 'el sí sin rastro';
  assert not public.regla_decidir(p, 'no', null), 'ha dicho no a una activa';

  -- deshacer el sí: vuelve a estar por decidir
  assert public.regla_deshacer(p), 'deshacer el sí falla';
  assert (select estado || '|' || regla || '|' || coalesce(decision, '-') from public.reglas where id = p) = 'propuesta|Regla de prueba C|-', 'deshacer el sí mal';

  -- la sesión no escribe directamente
  begin
    update public.reglas set regla = 'x' where id = p;
    assert false, 'authenticated escribe en reglas';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
set local role service_role;

do $$
declare
  a uuid;
begin
  select id into a from public.reglas where regla = 'Regla de prueba B';
  -- ni la service_role toca las tablas ni las funciones de Jordi saltan su puerta
  begin
    delete from public.reglas_historial;
    assert false, 'service_role borra historial';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.reglas_historial set quien = 'pc';
    assert false, 'service_role cambia historial';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.reglas set regla = 'x' where id = a;
    assert false, 'service_role escribe en reglas';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
