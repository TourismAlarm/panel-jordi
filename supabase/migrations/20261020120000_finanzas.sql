-- Fase 2: módulo Finanzas (tablas fin_*). Mismo modelo que Control-Financiero, con:
--  · user_id uuid = auth.users (antes: id de Google en texto)
--  · RLS real por usuario (antes: sin políticas y todo por service_role)
--  · IBAN: nunca completo. bank_links guarda solo los últimos 4 dígitos y una huella (HMAC) para reconocer traspasos propios.

create function public.fin_set_updated_at() returns trigger language plpgsql set search_path = '' as
$$ begin new.updated_at = now(); return new; end $$;

create table public.fin_profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  currency text not null default 'EUR',
  onboarding_completed boolean not null default false,
  financial_month_start_day integer not null default 1 check (financial_month_start_day between 1 and 28),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.fin_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('bank', 'cash', 'credit_card', 'savings', 'investment')),
  balance numeric(15, 2) not null default 0,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  role text check (role is null or role in ('daily', 'debts', 'savings', 'home')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.fin_accounts (user_id);

create table public.fin_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text,
  is_system boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, name, type)
);
create index on public.fin_categories (user_id, type);

create table public.fin_recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  account_id uuid references public.fin_accounts on delete set null,
  category_id uuid references public.fin_categories on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15, 2) not null check (amount > 0),
  description text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date date not null,
  end_date date,
  next_occurrence date not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.fin_recurring_rules (user_id);

-- Solo la usa el servidor (service_role): contiene la sesión del banco.
create table public.fin_bank_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  provider text not null default 'enablebanking',
  aspsp_name text not null,
  aspsp_country text not null,
  session_id text not null,
  account_uid text not null,
  iban_ultimos4 text check (iban_ultimos4 is null or iban_ultimos4 ~ '^[0-9A-Z]{4}$'),
  iban_hash text,
  account_name text,
  currency text default 'EUR',
  account_id uuid references public.fin_accounts on delete set null,
  valid_until timestamptz,
  status text not null default 'active' check (status in ('active', 'expired', 'error', 'revoked')),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, account_uid)
);
create index on public.fin_bank_links (user_id);

create table public.fin_bank_auth_states (
  state text primary key,
  user_id uuid not null references auth.users on delete cascade,
  aspsp_name text not null,
  aspsp_country text not null,
  created_at timestamptz default now()
);

create table public.fin_loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  type text not null check (type in ('borrowed', 'lent')),
  contact_name text not null,
  principal_amount numeric(15, 2) not null check (principal_amount > 0),
  outstanding_amount numeric(15, 2) not null check (outstanding_amount >= 0),
  interest_rate numeric(5, 2) not null default 0 check (interest_rate >= 0),
  start_date date not null,
  due_date date,
  status text not null default 'active' check (status in ('active', 'paid', 'cancelled')),
  notes text,
  bank_match text,
  monthly_payment numeric(15, 2),
  payment_day integer check (payment_day is null or payment_day between 1 and 31),
  account_id uuid references public.fin_accounts on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.fin_loans (user_id);

create table public.fin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  account_id uuid references public.fin_accounts on delete set null,
  category_id uuid references public.fin_categories on delete set null,
  type text not null check (type in ('income', 'expense')),
  amount numeric(15, 2) not null check (amount > 0),
  description text,
  date date not null default current_date,
  notes text,
  tags text[],
  recurring_rule_id uuid references public.fin_recurring_rules on delete set null,
  external_id text,
  kind text not null default 'regular' check (kind in ('regular', 'internal_transfer', 'investment', 'debt_payment')),
  source text not null default 'manual' check (source in ('manual', 'csv', 'bank_sync', 'recurring')),
  counterparty text,
  bank_link_id uuid references public.fin_bank_links on delete set null,
  loan_id uuid references public.fin_loans on delete set null,
  refund_of uuid references public.fin_transactions on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.fin_transactions (user_id, date desc);
create index on public.fin_transactions (user_id, category_id);
create index on public.fin_transactions (user_id, kind);
create index on public.fin_transactions (user_id, external_id) where external_id is not null;
create index on public.fin_transactions (loan_id) where loan_id is not null;
create index on public.fin_transactions (refund_of) where refund_of is not null;

create table public.fin_loan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  loan_id uuid not null references public.fin_loans on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  principal_paid numeric(15, 2) not null default 0 check (principal_paid >= 0),
  interest_paid numeric(15, 2) not null default 0 check (interest_paid >= 0),
  payment_date date not null,
  notes text,
  transaction_id uuid references public.fin_transactions on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index on public.fin_loan_payments (loan_id);
create unique index on public.fin_loan_payments (transaction_id) where transaction_id is not null;

create table public.fin_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  category_id uuid references public.fin_categories on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  month integer not null check (month between 1 and 12),
  year integer not null check (year >= 2000),
  alert_threshold numeric(5, 2) not null default 80 check (alert_threshold between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, category_id, month, year)
);

create table public.fin_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  from_account_id uuid not null references public.fin_accounts on delete cascade,
  to_account_id uuid not null references public.fin_accounts on delete cascade,
  amount numeric(15, 2) not null check (amount > 0),
  description text,
  date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (from_account_id <> to_account_id)
);

create table public.fin_savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name varchar(200) not null,
  target_amount numeric(15, 2) not null check (target_amount > 0),
  current_amount numeric(15, 2) not null default 0 check (current_amount >= 0),
  target_date date,
  description text,
  icon varchar(50),
  color varchar(50),
  is_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.fin_dismissed_suggestions (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  created_at timestamptz default now(),
  primary key (user_id, key)
);

create table public.fin_category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  pattern text not null,
  category_id uuid not null references public.fin_categories on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, pattern)
);

-- updated_at automático
do $$ declare t text; begin
  foreach t in array array['fin_profiles','fin_accounts','fin_categories','fin_recurring_rules','fin_bank_links','fin_loans',
                           'fin_transactions','fin_loan_payments','fin_budgets','fin_transfers','fin_savings_goals'] loop
    execute format('create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.fin_set_updated_at()', t);
  end loop;
end $$;

-- Categorías por defecto al crear el perfil
create function public.fin_crear_categorias(p_user_id uuid) returns void language plpgsql set search_path = '' as $$
begin
  insert into public.fin_categories (user_id, name, type, icon, color, is_system) values
    (p_user_id, 'Alimentación', 'expense', '🛒', '#EF4444', true),
    (p_user_id, 'Restaurantes', 'expense', '🍽️', '#F97316', true),
    (p_user_id, 'Transporte', 'expense', '🚗', '#FB923C', true),
    (p_user_id, 'Vivienda', 'expense', '🏠', '#FBBF24', true),
    (p_user_id, 'Telecomunicaciones', 'expense', '📱', '#A3E635', true),
    (p_user_id, 'Salud', 'expense', '🏥', '#4ADE80', true),
    (p_user_id, 'Educación', 'expense', '📚', '#34D399', true),
    (p_user_id, 'Entretenimiento', 'expense', '🎮', '#2DD4BF', true),
    (p_user_id, 'Compras', 'expense', '🛍️', '#22D3EE', true),
    (p_user_id, 'Viajes', 'expense', '✈️', '#38BDF8', true),
    (p_user_id, 'Mascotas', 'expense', '🐕', '#60A5FA', true),
    (p_user_id, 'Seguros', 'expense', '🛡️', '#818CF8', true),
    (p_user_id, 'Comisiones bancarias', 'expense', '🏦', '#A78BFA', true),
    (p_user_id, 'Impuestos', 'expense', '📋', '#C084FC', true),
    (p_user_id, 'Regalos', 'expense', '🎁', '#E879F9', true),
    (p_user_id, 'Otros Gastos', 'expense', '📌', '#F87171', true),
    (p_user_id, 'Nómina', 'income', '💼', '#10B981', true),
    (p_user_id, 'Freelance', 'income', '💻', '#14B8A6', true),
    (p_user_id, 'Inversiones', 'income', '📈', '#0EA5E9', true),
    (p_user_id, 'Intereses', 'income', '💰', '#6366F1', true),
    (p_user_id, 'Regalos', 'income', '🎁', '#A855F7', true),
    (p_user_id, 'Otros Ingresos', 'income', '📌', '#10B981', true)
  on conflict (user_id, name, type) do nothing;
end $$;
revoke execute on function public.fin_crear_categorias(uuid) from public, anon, authenticated;

create function public.fin_trigger_categorias() returns trigger language plpgsql set search_path = '' as
$$ begin perform public.fin_crear_categorias(new.id); return new; end $$;
revoke execute on function public.fin_trigger_categorias() from public, anon, authenticated;
create trigger fin_categorias_al_crear_perfil after insert on public.fin_profiles
  for each row execute function public.fin_trigger_categorias();

-- RLS: tablas de datos del usuario (la app las lee y escribe con su sesión)
do $$ declare t text; col text; begin
  foreach t in array array['fin_profiles','fin_accounts','fin_categories','fin_recurring_rules','fin_loans','fin_transactions',
                           'fin_loan_payments','fin_budgets','fin_transfers','fin_savings_goals','fin_dismissed_suggestions','fin_category_rules'] loop
    col := case when t = 'fin_profiles' then 'id' else 'user_id' end;
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy propio on public.%I for all to authenticated using (%I = (select auth.uid()) and (select public.es_permitido())) with check (%I = (select auth.uid()) and (select public.es_permitido()))', t, col, col);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop;
end $$;

-- Tablas del banco: RLS activado y sin políticas → solo el servidor (service_role) las toca.
alter table public.fin_bank_links enable row level security;
alter table public.fin_bank_auth_states enable row level security;
revoke all on public.fin_bank_links, public.fin_bank_auth_states from anon, authenticated;
