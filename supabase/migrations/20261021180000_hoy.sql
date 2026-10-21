-- Fase 5: resumen diario («Hoy») y conexión de solo lectura con Google (Gmail + Calendar).
create table public.resumenes_diarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  fecha date not null,
  resumen text not null,
  prioridades jsonb not null default '[]',
  senales jsonb not null default '{}',
  generado_en timestamptz not null default now(),
  enviado_en timestamptz,
  error_envio text,
  unique (user_id, fecha)
);
alter table public.resumenes_diarios enable row level security;
create policy leer on public.resumenes_diarios for select to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()));
revoke all on public.resumenes_diarios from anon, authenticated;
grant select on public.resumenes_diarios to authenticated;

-- El refresh token de Google va CIFRADO (AES-256-GCM) y solo lo toca el servidor (service_role):
-- RLS activado y sin ninguna política ni permiso para el navegador.
create table public.google_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  refresh_cifrado text not null,
  scopes text not null,
  correo text,
  creado_en timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
revoke all on public.google_tokens from anon, authenticated;
