-- Data de nascimento do membro da equipe, opcional, editavel em /admin/perfil.

alter table staff_members
  add column birth_date date;
