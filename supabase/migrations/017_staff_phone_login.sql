-- Lets a staff member log in through the same phone+OTP flow clients use,
-- instead of remembering a separate email/password. The same "Entrar" page
-- routes to /admin when the verified phone matches a staff_members row, and
-- to /conta otherwise — so only a phone an owner explicitly registered here
-- can ever reach the admin session bridge.
alter table staff_members
  add column phone text unique;
