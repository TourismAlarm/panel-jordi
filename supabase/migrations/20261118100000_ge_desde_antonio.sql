-- Antonio crea el GE de un material que Jordi ya subió a Drive («contenido para claude/Nuevos/<carpeta>»), sin crear otra carpeta.
-- La carpeta queda apuntada en el vídeo: es la de los brutos y sirve para no crear dos vídeos con el mismo material.

alter table public.videos add column carpeta_drive_id text;
create unique index videos_carpeta_drive_unica on public.videos (carpeta_drive_id) where carpeta_drive_id is not null;

-- Todo o nada. Si la carpeta ya tiene vídeo, no numera ni crea nada: devuelve el que hay con nuevo = false.
-- Numera con siguiente_ge(), igual que crear_ge_urgencia. Solo la service_role (la ruta /api/bots/videos).
create function public.crear_ge_de_carpeta(p_titulo text, p_carpeta text, p_sin_guion boolean, p_estado text, p_fecha date)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  codigo text;
  titulo text := left(btrim(p_titulo), 80);
  carpeta text := btrim(p_carpeta);
begin
  if titulo = '' then raise exception 'falta el título'; end if;
  if carpeta = '' then raise exception 'falta la carpeta'; end if;
  if p_estado not in ('material_listo', 'esperando_material') then raise exception 'estado no válido'; end if;

  select id into codigo from public.videos where carpeta_drive_id = carpeta;
  if found then return jsonb_build_object('id', codigo, 'nuevo', false); end if;

  codigo := public.siguiente_ge();
  begin
    insert into public.videos (id, titulo, estado, fecha_trabajo, sin_guion, origen, carpeta_drive_id)
    values (codigo, titulo, p_estado, p_fecha, p_sin_guion, 'panel', carpeta);
  exception when unique_violation then
    -- Dos llamadas a la vez con la misma carpeta: gana la primera y esta devuelve su vídeo.
    select id into codigo from public.videos where carpeta_drive_id = carpeta;
    if not found then raise; end if;
    return jsonb_build_object('id', codigo, 'nuevo', false);
  end;
  return jsonb_build_object('id', codigo, 'nuevo', true);
end;
$$;
revoke all on function public.crear_ge_de_carpeta(text, text, boolean, text, date) from public, anon, authenticated;
grant execute on function public.crear_ge_de_carpeta(text, text, boolean, text, date) to service_role;
