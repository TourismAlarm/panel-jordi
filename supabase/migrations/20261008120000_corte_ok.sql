-- Montaje en dos fases: el PC monta primero el CORTE (ffmpeg, sin subtítulos ni título) y Jordi lo revisa.
-- «Corte OK» desde el panel → el PC hace el ACABADO en ChatCut (subtítulos, título) y Jordi lo aprueba o pide cambios.
-- Estados nuevos de «videos» (texto libre, sin check): corte_listo, acabado_pendiente, acabado_listo, exportacion_pendiente.

alter table public.peticiones drop constraint peticiones_tipo_check;
alter table public.peticiones
  add constraint peticiones_tipo_check
  check (tipo in ('descartar', 'nuevo', 'aprobar', 'cambios', 'corregir', 'material_listo', 'sin_guion', 'corte_ok'));
