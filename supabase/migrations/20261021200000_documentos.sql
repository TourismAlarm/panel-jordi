-- Fase 6: Documentos (doc_*). Archivo con ficha, texto por página (búsqueda en español) y vencimientos.
create table public.doc_documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  nombre text not null,
  categoria text not null default 'Sin clasificar' check (categoria in ('Seguros','Contratos','Vehículos y maquinaria','Permisos y autorizaciones','Identidad y trámites','Salud','Hogar','Finanzas e impuestos','Notas','Sin clasificar')),
  tipo text,
  ruta text,            -- ruta en el bucket privado «documentos»: <user_id>/<uuid>-<nombre>; null en las notas
  mime text,
  tamano bigint,
  estado text not null default 'pendiente' check (estado in ('pendiente','procesado','error','nota')),
  error text,
  subido_en timestamptz not null default now(),
  procesado_en timestamptz
);
create index on public.doc_documentos (user_id, estado, subido_en desc);

create table public.doc_paginas (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.doc_documentos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  pagina int not null check (pagina >= 1),
  texto text not null,
  tsv tsvector generated always as (to_tsvector('spanish', texto)) stored,
  unique (documento_id, pagina)
);
create index on public.doc_paginas using gin (tsv);

-- Campos sin dato = null / vacío: la pantalla enseña «No especificado». Nunca se rellenan con suposiciones.
create table public.doc_fichas (
  documento_id uuid primary key references public.doc_documentos on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  partes text[] not null default '{}',
  referencia text,                       -- solo los últimos 4 dígitos si es sensible
  inicio date,
  vencimiento date,
  importes jsonb not null default '[]',  -- [{concepto, importe}]
  condiciones text[] not null default '{}' check (cardinality(condiciones) <= 3),
  contacto text,
  origen text not null default 'manual' check (origen in ('claude','manual')),
  actualizado_en timestamptz not null default now()
);
create index on public.doc_fichas (user_id, vencimiento);

alter table public.doc_documentos enable row level security;
alter table public.doc_paginas enable row level security;
alter table public.doc_fichas enable row level security;

create policy propio on public.doc_documentos for all to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()))
  with check (user_id = (select auth.uid()) and (select public.es_permitido()));
create policy propio on public.doc_paginas for all to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()))
  with check (user_id = (select auth.uid()) and (select public.es_permitido()));
create policy propio on public.doc_fichas for all to authenticated
  using (user_id = (select auth.uid()) and (select public.es_permitido()))
  with check (user_id = (select auth.uid()) and (select public.es_permitido()));

revoke all on public.doc_documentos, public.doc_paginas, public.doc_fichas from anon, authenticated;
grant select, insert, update, delete on public.doc_documentos, public.doc_paginas, public.doc_fichas to authenticated;

-- Búsqueda de texto completo en español. SECURITY INVOKER: respeta RLS (solo ves lo tuyo).
-- Las coincidencias se marcan con «» (no HTML) para pintarlas sin riesgo.
create function public.doc_buscar(q text)
  returns table (documento_id uuid, pagina int, extracto text, relevancia real)
  language sql stable security invoker set search_path = '' as
$$ select p.documento_id, p.pagina,
          ts_headline('spanish', p.texto, websearch_to_tsquery('spanish', q), 'MaxFragments=1,MinWords=10,MaxWords=30,StartSel=«,StopSel=»'),
          ts_rank(p.tsv, websearch_to_tsquery('spanish', q))
   from public.doc_paginas p
   where p.tsv @@ websearch_to_tsquery('spanish', q)
   order by 4 desc limit 40 $$;
revoke execute on function public.doc_buscar(text) from public, anon;
grant execute on function public.doc_buscar(text) to authenticated;

-- Bucket privado: cada uno solo ve y sube dentro de su carpeta <user_id>/.
insert into storage.buckets (id, name, public, file_size_limit)
  values ('documentos', 'documentos', false, 26214400) on conflict (id) do nothing;
create policy doc_leer on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.es_permitido()));
create policy doc_subir on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.es_permitido()));
create policy doc_borrar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.es_permitido()));
