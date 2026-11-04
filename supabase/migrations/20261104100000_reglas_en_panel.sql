-- Las reglas pasan a vivir aquí: el panel numera, Antonio las cambia y Jordi decide al momento. El PC solo se baja una copia.
-- Todo cambio pasa por estas funciones y queda en reglas_historial; ni la service_role escribe en las tablas directamente.

alter table public.reglas add column version integer not null default 1;
alter table public.reglas add column actualizada_por text;

alter table public.reglas drop constraint reglas_agente_check;
alter table public.reglas add constraint reglas_agente_check
  check (agente in ('guionista', 'archivador', 'observador', 'montador', 'analista', 'coordinador', 'ideas', 'antonio'));
alter table public.reglas drop constraint reglas_origen_check;
alter table public.reglas add constraint reglas_origen_check
  check (origen in ('retro', 'analista', 'correccion', 'manual', 'antonio'));

comment on table public.reglas is 'Reglas de los agentes. Manda esta tabla: se cambia con las funciones regla_* y cada cambio queda en reglas_historial.';

drop policy decidir on public.reglas;
revoke update (decision, decision_texto, decidida_en) on public.reglas from authenticated;
revoke insert, update, delete, truncate on public.reglas from service_role;

create table public.reglas_historial (
  id bigint generated always as identity primary key,
  regla_id uuid not null references public.reglas,
  clave text not null,
  accion text not null check (accion in ('crear', 'editar', 'retirar', 'reactivar', 'deshacer')),
  texto_antes text,
  texto_despues text,
  estado_antes text,
  estado_despues text,
  quien text not null check (quien in ('antonio', 'jordi', 'pc')),
  por_que text,
  creado timestamptz not null default now()
);
create index reglas_historial_por_regla on public.reglas_historial (regla_id, id desc);
alter table public.reglas_historial enable row level security;
create policy leer on public.reglas_historial for select to authenticated using ((select public.es_permitido()));
revoke all on public.reglas_historial from anon, authenticated;
grant select on public.reglas_historial to authenticated;
revoke insert, update, delete, truncate on public.reglas_historial from service_role;

-- 29 = lo último que usó el PC, contando trabajo/reglas/decisiones.jsonl (R0029 el 4-11-2026).
insert into public.contadores (nombre, valor)
select 'regla', greatest(29, coalesce(max(substring(clave from '^R(\d+)$')::integer), 0)) from public.reglas;

create function public.siguiente_regla() returns text
language plpgsql security definer set search_path = ''
as $$
declare
  n integer;
  codigo text;
begin
  loop
    update public.contadores set valor = valor + 1 where nombre = 'regla' returning valor into n;
    if n is null then raise exception 'falta el contador regla'; end if;
    codigo := 'R' || lpad(n::text, 4, '0');
    exit when not exists (select 1 from public.reglas where clave = codigo);
  end loop;
  return codigo;
end;
$$;
revoke all on function public.siguiente_regla() from public, anon, authenticated, service_role;

-- Aplica un cambio a la regla ya bloqueada y lo apunta. Solo la llaman las funciones de abajo.
create function public.regla_cambiar(p_regla public.reglas, p_accion text, p_texto text, p_estado text, p_quien text, p_por_que text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v integer;
begin
  update public.reglas
  set regla = p_texto, estado = p_estado, version = version + 1, actualizada_por = p_quien, actualizada_en = now()
  where id = p_regla.id
  returning version into v;
  insert into public.reglas_historial (regla_id, clave, accion, texto_antes, texto_despues, estado_antes, estado_despues, quien, por_que)
  values (p_regla.id, p_regla.clave, p_accion, p_regla.regla, p_texto, p_regla.estado, p_estado, p_quien, p_por_que);
  return v;
end;
$$;
revoke all on function public.regla_cambiar(public.reglas, text, text, text, text, text) from public, anon, authenticated, service_role;

-- La misma regla no se duplica: un reintento devuelve la que hay, y una retirada vuelve a estar activa.
create function public.regla_crear(
  p_agente text, p_regla text, p_evidencia text, p_medida text, p_por_que text, p_quien text,
  p_origen text default 'antonio', p_estado text default 'activa'
) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reglas;
  texto text := btrim(p_regla);
  codigo text;
begin
  if texto = '' then raise exception 'falta el texto de la regla'; end if;
  if p_estado not in ('activa', 'propuesta') then raise exception 'estado no válido'; end if;

  select * into r from public.reglas
  where agente = p_agente and lower(regla) = lower(texto)
    and (estado in ('activa', 'propuesta') or (p_estado = 'activa' and estado = 'quitada'))
  order by estado = 'activa' desc, creada_en desc limit 1
  for update;
  if found then
    if r.estado = 'activa' or p_estado = 'propuesta' then return r.clave; end if;
    perform public.regla_cambiar(r, 'reactivar', r.regla, 'activa', p_quien, p_por_que);
    return r.clave;
  end if;

  codigo := public.siguiente_regla();
  insert into public.reglas (clave, agente, regla, evidencia, medida, origen, estado, actualizada_por)
  values (codigo, p_agente, texto, nullif(btrim(p_evidencia), ''), nullif(btrim(p_medida), ''), p_origen, p_estado, p_quien)
  returning * into r;
  insert into public.reglas_historial (regla_id, clave, accion, texto_despues, estado_despues, quien, por_que)
  values (r.id, codigo, 'crear', texto, p_estado, p_quien, p_por_que);
  return codigo;
end;
$$;
revoke all on function public.regla_crear(text, text, text, text, text, text, text, text) from public, anon, authenticated;

-- Devuelve la versión. P0002 = no existe (404 en la API); otro error = no se puede (409).
create function public.regla_editar(p_clave text, p_regla text, p_por_que text, p_quien text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reglas;
  texto text := btrim(p_regla);
begin
  if texto = '' then raise exception 'falta el texto de la regla'; end if;
  select * into r from public.reglas where clave = p_clave for update;
  if not found then raise exception 'esa regla no existe' using errcode = 'P0002'; end if;
  if r.estado <> 'activa' then raise exception 'solo se edita una regla activa'; end if;
  if r.regla = texto then return r.version; end if;
  return public.regla_cambiar(r, 'editar', texto, r.estado, p_quien, p_por_que);
end;
$$;
revoke all on function public.regla_editar(text, text, text, text) from public, anon, authenticated;

create function public.regla_retirar(p_clave text, p_por_que text, p_quien text) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reglas;
begin
  select * into r from public.reglas where clave = p_clave for update;
  if not found then raise exception 'esa regla no existe' using errcode = 'P0002'; end if;
  if r.estado = 'quitada' then return r.version; end if;
  if r.estado <> 'activa' then raise exception 'solo se retira una regla activa'; end if;
  return public.regla_cambiar(r, 'retirar', r.regla, 'quitada', p_quien, p_por_que);
end;
$$;
revoke all on function public.regla_retirar(text, text, text) from public, anon, authenticated;

-- Sí / No / Quitar de Jordi: se aplican al momento. false = la regla ya no está para eso.
create function public.regla_decidir(p_id uuid, p_decision text, p_texto text) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reglas;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  select * into r from public.reglas where id = p_id for update;
  if not found then return false; end if;

  if r.estado = 'propuesta' and p_decision = 'si' then
    perform public.regla_cambiar(r, 'crear', coalesce(nullif(btrim(p_texto), ''), r.regla), 'activa', 'jordi', null);
  elsif r.estado = 'propuesta' and p_decision = 'no' then
    perform public.regla_cambiar(r, 'retirar', r.regla, 'rechazada', 'jordi', null);
  elsif r.estado = 'activa' and p_decision = 'quitar' then
    perform public.regla_cambiar(r, 'retirar', r.regla, 'quitada', 'jordi', null);
  else
    return false;
  end if;

  update public.reglas
  set decision = p_decision, decision_texto = nullif(btrim(p_texto), ''), decidida_en = now()
  where id = p_id;
  return true;
end;
$$;
revoke all on function public.regla_decidir(uuid, text, text) from public, anon;
grant execute on function public.regla_decidir(uuid, text, text) to authenticated;

-- «Deshacer» de Aprende: vuelve a como estaba antes del último cambio. Deshacer un deshacer no vale: false.
create function public.regla_deshacer(p_id uuid) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reglas;
  h public.reglas_historial;
begin
  if not public.es_permitido() then raise exception 'no permitido'; end if;
  select * into r from public.reglas where id = p_id for update;
  if not found then return false; end if;
  select * into h from public.reglas_historial where regla_id = p_id order by id desc limit 1;
  if not found or h.accion = 'deshacer' then return false; end if;

  -- Una regla recién creada no tiene «antes»: deshacerla es retirarla.
  perform public.regla_cambiar(r, 'deshacer', coalesce(h.texto_antes, r.regla), coalesce(h.estado_antes, 'quitada'), 'jordi', 'Deshecho desde Aprende');
  update public.reglas set decision = null, decision_texto = null, decidida_en = null where id = p_id;
  return true;
end;
$$;
revoke all on function public.regla_deshacer(uuid) from public, anon;
grant execute on function public.regla_deshacer(uuid) to authenticated;
