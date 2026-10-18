create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_type text not null default 'monthly' check (period_type in ('weekly', 'monthly')),
  total_budget numeric(12,2) not null default 0,
  category_limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null,
  description text not null default '',
  amount numeric(12,2) not null check (amount >= 0),
  category text not null default 'Other',
  spend_type text not null default 'individual' check (spend_type in ('individual', 'group')),
  split_type text not null default 'none' check (split_type in ('none', 'equal', 'custom')),
  group_size integer null check (group_size is null or group_size >= 2),
  my_share_amount numeric(12,2) not null check (my_share_amount >= 0),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_budgets_user_created on public.budgets(user_id, created_at desc);
create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);

alter table public.budgets enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "Users can read own budgets" on public.budgets;
drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can read own budgets"
  on public.budgets
  for select
  using (auth.uid() = user_id);
create policy "Users can insert own budgets"
  on public.budgets
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;
drop policy if exists "Users can update own transactions" on public.transactions;
drop policy if exists "Users can delete own transactions" on public.transactions;
create policy "Users can read own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on public.transactions
  for insert
  with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);
