-- payments.receipt_number defaults to nextval('payments_receipt_number_seq'),
-- but the sequence had no explicit grant for service_role/authenticated/anon,
-- so any insert done outside the Postgres owner role (e.g. via the
-- service-role API key used by the seed script and by adminDb() in the app)
-- failed with "permission denied for sequence payments_receipt_number_seq".
grant usage, select on sequence payments_receipt_number_seq to service_role, authenticated, anon;
