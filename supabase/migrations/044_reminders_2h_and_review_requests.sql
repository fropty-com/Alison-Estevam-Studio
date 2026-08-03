-- Tracking flags for two new automated client emails: a reminder sent ~2h
-- before the appointment (separate from the existing 24h reminder_sent),
-- and a review-request email sent once after checkout.

alter table appointments
  add column reminder_2h_sent boolean not null default false,
  add column review_request_sent boolean not null default false;
