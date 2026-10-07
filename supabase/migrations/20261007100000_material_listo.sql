-- «Ya he subido todo»: Jordi avisa desde el panel de que el material grabado está completo.
-- Hasta entonces el PC no procesa el vídeo (ni inventario, ni observador, ni montador).
-- Nuevo tipo de petición; la app ya puede insertar tipo y video_id (permisos_minimos), no hace falta más.

alter table public.peticiones drop constraint peticiones_tipo_check;
alter table public.peticiones
  add constraint peticiones_tipo_check
  check (tipo in ('descartar', 'nuevo', 'aprobar', 'cambios', 'corregir', 'material_listo'));
