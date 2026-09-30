-- Aplicada en Supabase «Panel-jordi» el 30-09-2026.
-- T0.2 · Permisos mínimos. RLS ya frenaba todo esto en la práctica; aquí se deja de conceder.

-- anon no usa ninguna tabla (la app siempre va con sesión)
revoke all on public.videos, public.preguntas, public.ejecuciones_agentes, public.peticiones from anon;

-- peticiones: la app solo lee, crea (sin elegir id, fechas ni recogida) y borra para deshacer
revoke all on public.peticiones from authenticated;
grant select, delete on public.peticiones to authenticated;
grant insert (tipo, video_id, motivo, texto, fecha_trabajo) on public.peticiones to authenticated;

-- lectura: sin cambios de uso, solo se quitan TRIGGER y REFERENCES
revoke trigger, references on public.videos, public.preguntas, public.ejecuciones_agentes from authenticated;
