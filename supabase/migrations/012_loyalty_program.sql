-- Loyalty program: every N completed visits (visits_required), the client
-- earns one reward. Progress is derived from real appointment history
-- (completed count minus redeemed count * visits_required) instead of a
-- standalone counter on clients, so it can never drift out of sync with
-- what actually happened.
create table loyalty_settings (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  visits_required     integer not null default 10,
  reward_description  text not null default 'Um atendimento grátis',
  active              boolean not null default true,
  updated_at          timestamptz not null default now()
);
insert into loyalty_settings (visits_required, reward_description) values (10, 'Um atendimento grátis');

create table loyalty_redemptions (
  id           uuid primary key default extensions.uuid_generate_v4(),
  client_id    uuid not null references clients(id),
  redeemed_at  timestamptz not null default now(),
  redeemed_by  uuid references auth.users(id),
  notes        text
);
create index loyalty_redemptions_client_id_idx on loyalty_redemptions(client_id);

alter table loyalty_settings enable row level security;
alter table loyalty_redemptions enable row level security;
create policy loyalty_settings_admin_all on loyalty_settings for all using ((select auth.role()) = 'service_role');
create policy loyalty_redemptions_admin_all on loyalty_redemptions for all using ((select auth.role()) = 'service_role');
