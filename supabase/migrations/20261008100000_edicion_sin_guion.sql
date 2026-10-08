-- Edición sin guion: una urgencia que Jordi graba sin que haya pasado por el guionista.
-- Desde el panel pide «Ya lo he grabado»; el PC crea el proyecto (con su carpeta de Drive para subir
-- el material) y lo sube a «videos» con sin_guion = true, para que los pasos no esperen un guion.

alter table public.peticiones drop constraint peticiones_tipo_check;
alter table public.peticiones
  add constraint peticiones_tipo_check
  check (tipo in ('descartar', 'nuevo', 'aprobar', 'cambios', 'corregir', 'material_listo', 'sin_guion'));

-- La escribe solo el sync (service_role); la app la lee con el select que ya tiene sobre «videos».
alter table public.videos add column sin_guion boolean not null default false;
