-- Categorías que propone el bot de Finanzas (o Antonio) para movimientos sin categoría.
-- El bot nunca cambia un movimiento: deja aquí su propuesta y Jordi la acepta o la rechaza en Finanzas.
-- Una propuesta por movimiento. Rechazada, se queda apuntada para que el bot no vuelva con la misma.
create table public.fin_propuestas_categoria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null unique references public.fin_transactions (id) on delete cascade,
  category_id uuid not null references public.fin_categories (id) on delete cascade,
  motivo text check (motivo is null or char_length(motivo) <= 300),
  bot text not null default 'finanzas' check (bot in ('antonio', 'finanzas')),
  estado text not null default 'propuesta' check (estado in ('propuesta', 'aceptada', 'rechazada')),
  creada timestamptz not null default now(),
  decidida_en timestamptz,
  constraint fin_propuestas_decidida check ((estado = 'propuesta') = (decidida_en is null))
);
create index fin_propuestas_pendientes on public.fin_propuestas_categoria (user_id, estado);

-- Como las tablas del banco: RLS activado y sin políticas. Solo la toca el servidor (service_role), filtrando por user_id.
alter table public.fin_propuestas_categoria enable row level security;
revoke all on public.fin_propuestas_categoria from anon, authenticated;
grant select, insert, update, delete on public.fin_propuestas_categoria to service_role;
