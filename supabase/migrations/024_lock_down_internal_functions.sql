-- check_rate_limit, redeem_coupon and release_coupon are internal helpers
-- meant to be called only from server code via the service-role client.
-- Postgres grants EXECUTE to PUBLIC by default on new functions, and that
-- was never revoked when they were created — since PostgREST exposes every
-- function in the public schema as /rest/v1/rpc/<name>, any anonymous
-- request could call redeem_coupon/release_coupon directly with an
-- arbitrary coupon id to burn or un-burn single-use coupons without ever
-- making a real booking, or spam check_rate_limit to write bogus rows keyed
-- by other people's IPs. Revoke the PUBLIC default so only service_role
-- (already granted explicitly) can call them.

revoke execute on function check_rate_limit(text, int, int) from public, anon, authenticated;
revoke execute on function redeem_coupon(uuid) from public, anon, authenticated;
revoke execute on function release_coupon(uuid) from public, anon, authenticated;
