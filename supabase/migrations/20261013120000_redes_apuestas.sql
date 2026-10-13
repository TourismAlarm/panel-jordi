-- Aplicada en Supabase «Panel-jordi» el 13-10-2026.
-- Qué probaba cada reel: el guionista apunta en el guion tema, tipo_gancho y prueba (apuesta del analista, A01…);
-- el PC (sync_panel.py, subir_redes) los sube aquí. apuestas.md va a informes_redes con semana = 'apuestas'.
alter table public.redes_reels add column tipo_gancho text, add column prueba text;
comment on column public.redes_reels.tipo_gancho is 'Tipo de gancho que apuntó el guionista (cifra+problema, pregunta, reto, antes/después, no cabe).';
comment on column public.redes_reels.prueba is 'Apuesta del analista que probaba el vídeo (A01…) o «ninguna».';
