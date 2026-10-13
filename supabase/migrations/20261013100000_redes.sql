-- Aplicada en Supabase «Panel-jordi» el 13-10-2026.
-- Pestaña «Redes» del panel: cómo van los reels y qué cambiar.
--   windsor_fotos  → la app ya puede LEERLAS (antes solo el PC). Son la fuente de los números.
--   redes_reels    → qué reel es qué: GE, tema, gancho y duración del montaje. Lo sube el PC (sync_panel.py)
--                    desde trabajo/metricas/registro.csv y el estado de cada vídeo. elsa=false = reel personal.
--   informes_redes → el informe semanal del analista (trabajo/feedback/informe-*.md), tal cual. Lo sube el PC.

create policy leer on public.windsor_fotos
  for select to authenticated using ((select public.es_permitido()));
grant select on public.windsor_fotos to authenticated;

create table public.redes_reels (
  permalink text primary key,                  -- https://www.instagram.com/reel/XXXX/
  ge text,                                     -- GE_005 si es un vídeo del sistema
  tema text,                                   -- nave/tanquetas, altura/jib, estructura grande/playa…
  gancho text,                                 -- gancho del guion (si lo hay)
  duracion_s numeric,                          -- duración del montaje final, para el % visto
  elsa boolean not null default true,          -- false = reel personal: fuera de las cuentas
  actualizado_en timestamptz not null default now()
);
alter table public.redes_reels enable row level security;
create policy leer on public.redes_reels
  for select to authenticated using ((select public.es_permitido()));
revoke all on public.redes_reels from anon, authenticated;
grant select on public.redes_reels to authenticated;

create table public.informes_redes (
  semana text primary key,                     -- 2026-41 (o el nombre del archivo si no es semanal)
  titulo text not null,
  markdown text not null,
  fecha date not null,                         -- día en que lo escribió el analista
  subido_en timestamptz not null default now()
);
alter table public.informes_redes enable row level security;
create policy leer on public.informes_redes
  for select to authenticated using ((select public.es_permitido()));
revoke all on public.informes_redes from anon, authenticated;
grant select on public.informes_redes to authenticated;
