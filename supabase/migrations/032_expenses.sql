-- Modulo Financeiro: despesas do negocio (aluguel, produtos, contas...),
-- base para DRE, fluxo de caixa e contas a pagar.

create table expenses (
  id           uuid primary key default extensions.uuid_generate_v4(),
  description  text not null,
  category     text not null,
  amount       numeric not null,
  is_fixed     boolean not null default false,
  due_date     date not null,
  paid_date    date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index expenses_due_date_idx  on expenses(due_date);
create index expenses_paid_date_idx on expenses(paid_date);

alter table expenses enable row level security;

create policy expenses_admin_all on expenses
  for all using ((select auth.role()) = 'service_role');
