-- Gorjetas: valor opcional registrado no checkout, separado do faturamento
-- do servico (nao entra no calculo de taxa de pagamento nem de desconto).

alter table payments
  add column tip_amount numeric not null default 0;
