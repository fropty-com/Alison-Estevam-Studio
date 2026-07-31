-- Chave Pix da barbearia, para o cliente pagar direto na conta.
-- Só é relevante na linha method='pix' de payment_fee_settings.

alter table payment_fee_settings
  add column pix_key text;
