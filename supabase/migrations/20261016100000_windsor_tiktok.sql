-- Aplicada en Supabase «Panel-jordi» el 16-10-2026.
-- Foto diaria de TikTok (conector tiktok_organic de Windsor). Tabla aparte de windsor_fotos (una fila por día y red)
-- para no tocar lo que ya lee Instagram. La escribe la tarea en la nube «ELSA - windsor (nube)»; el panel solo lee.
create table public.windsor_fotos_tiktok (
  fecha date primary key,
  tomada_en timestamptz not null default now(),
  datos jsonb not null                          -- array de vídeos tal cual los da Windsor
);
alter table public.windsor_fotos_tiktok enable row level security;
create policy leer on public.windsor_fotos_tiktok
  for select to authenticated using ((select public.es_permitido()));
revoke all on public.windsor_fotos_tiktok from anon, authenticated;
grant select on public.windsor_fotos_tiktok to authenticated;
