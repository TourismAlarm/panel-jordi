-- Bots de vida (dia, finanzas, salud, documentos): trabajan dentro del panel por /api/bots/*.
-- Leen dinero, salud y documentos; solo escriben sus informes, el resumen de Hoy y las fichas. Ninguna tabla fin_* cambia.

alter table public.actividad_bots drop constraint actividad_bots_bot_check;
alter table public.actividad_bots add constraint actividad_bots_bot_check
  check (bot in ('antonio', 'ideas', 'guionista', 'editor', 'dia', 'finanzas', 'salud', 'documentos'));

alter table public.bandeja drop constraint bandeja_origen_bot_check;
alter table public.bandeja add constraint bandeja_origen_bot_check
  check (origen_bot in ('antonio', 'ideas', 'guionista', 'editor', 'dia', 'finanzas', 'salud', 'documentos'));

-- Salud no está: lo privado no entra en la memoria que leen los bots de ELSA.
alter table public.memoria_comun drop constraint memoria_comun_autor_check;
alter table public.memoria_comun add constraint memoria_comun_autor_check
  check (autor in ('antonio', 'ideas', 'guionista', 'dia', 'finanzas', 'documentos'));

-- Quién escribió el resumen de la mañana. Hay una fila por día: el bot sustituye al del cron.
alter table public.resumenes_diarios add column origen text not null default 'cron' check (origen in ('cron', 'bot'));

alter table public.doc_fichas add column resumen text;
alter table public.doc_fichas add column titular text;
alter table public.doc_fichas drop constraint doc_fichas_origen_check;
alter table public.doc_fichas add constraint doc_fichas_origen_check check (origen in ('claude', 'manual', 'bot'));

-- Lo que concluyen los bots de Finanzas y Salud. Se añade y se lee; nunca se cambia ni se borra.
create table public.informes_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  bot text not null check (bot in ('finanzas', 'salud')),
  tipo text not null,
  periodo_desde date,
  periodo_hasta date,
  titulo text not null,
  cuerpo_md text not null,
  datos jsonb not null default '{}',
  creado timestamptz not null default now()
);
create index informes_bots_ultimo on public.informes_bots (bot, creado desc);

alter table public.informes_bots enable row level security;
create policy leer on public.informes_bots for select to authenticated using ((select public.es_permitido()) and user_id = (select auth.uid()));
revoke all on public.informes_bots from anon, authenticated;
grant select on public.informes_bots to authenticated;
grant select, insert on public.informes_bots to service_role;
