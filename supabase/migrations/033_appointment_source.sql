-- Origem do agendamento: 'online' (cliente reservou pelo site) ou
-- 'presencial' (barbeiro cadastrou manualmente, ex: walk-in/telefone).
-- Default 'online' cobre o historico existente, que veio inteiro do
-- fluxo publico ate hoje.

alter table appointments
  add column source text not null default 'online'
  check (source in ('online', 'presencial'));
