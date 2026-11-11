-- Cuándo sale cada vídeo en cada red. Lo escribe Antonio por /api/bots/publicaciones (una fila por vídeo y red);
-- la app solo lo lee para la tarjeta «Para publicar» de Proyectos.

create table public.publicaciones (
  video_id text not null references public.videos,
  red text not null check (red in ('instagram', 'tiktok', 'youtube')),
  estado text not null check (estado in ('programado', 'publicado')),
  fecha timestamptz,                           -- cuándo sale (programado) o cuándo salió (publicado)
  enlace text,
  creado_por text not null,
  actualizado_en timestamptz not null default now(),
  primary key (video_id, red),
  check (estado <> 'programado' or fecha is not null)
);
create index publicaciones_por_fecha on public.publicaciones (estado, fecha);
alter table public.publicaciones enable row level security;
create policy leer on public.publicaciones for select to authenticated using ((select public.es_permitido()));
revoke all on public.publicaciones from anon, authenticated;
grant select on public.publicaciones to authenticated;
revoke truncate on public.publicaciones from service_role;
