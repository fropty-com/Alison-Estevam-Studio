-- Data de nascimento do cliente, opcional, capturada/editada pelo admin.
-- Base do card "Aniversariantes deste mes".

alter table clients
  add column birth_date date;
