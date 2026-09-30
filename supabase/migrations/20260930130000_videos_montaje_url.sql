-- T3.3 · Revisar el montaje dentro del panel: enlace al último export.
-- Lo escribe el PC (service_role) con el enlace compartido de Drive del montaje vigente.
-- La app solo lee: videos ya tiene select para authenticated y ningún grant de escritura.

alter table public.videos add column montaje_url text;
