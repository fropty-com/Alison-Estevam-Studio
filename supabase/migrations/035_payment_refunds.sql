alter table payments add column refunded_at timestamptz;
alter table payments add column refund_reason text;
