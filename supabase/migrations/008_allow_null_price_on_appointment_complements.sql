-- appointment_complements.price is a snapshot of complements.price at
-- booking time; now that a complement can have an undefined ("a definir")
-- price, this snapshot column must allow null too.
alter table appointment_complements alter column price drop not null;
