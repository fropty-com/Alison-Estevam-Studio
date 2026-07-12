-- Role-based access for the admin panel: distinguishes the business owner
-- (full access, including financial reports and fee settings) from staff
-- (operational access: agenda, check-in/checkout, clients, services).
-- Without this, every admin login sees the full P&L regardless of role.
create table staff_members (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       text not null check (role = any (array['owner', 'staff'])),
  created_at timestamptz not null default now()
);

alter table staff_members enable row level security;
create policy staff_members_admin_all on staff_members for all using ((select auth.role()) = 'service_role');

-- Seed from the existing Supabase Auth users at the time this migration was
-- written. The two accounts actively used to log in (the developer's own and
-- the business owner's) are marked owner; the two unused/legacy accounts
-- default to staff (least privilege) until someone with owner access
-- promotes them from /admin/equipe.
insert into staff_members (id, name, role) values
  ('096c2551-fc0c-4be6-9d52-d0fc1400cf6d', 'Everton', 'owner'),
  ('4d587f72-90da-4c78-a426-afa5870726c9', 'Alison Estevam', 'owner'),
  ('0601f64d-dbc7-47db-ba0a-0c166ec1de8b', 'Admin (legado)', 'staff'),
  ('5be3c0ca-1bbb-4daa-95ca-3441cf88fde7', 'Conta (legado)', 'staff');
