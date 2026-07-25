-- Coupon redemption was read-then-write in application code (read uses_count,
-- compute +1, write it back) - two concurrent bookings using the same
-- single-use coupon could both read uses_count=0, both compute 1, both
-- write 1: the coupon looks "used once" in the DB but was actually
-- redeemed twice. Atomic UPDATE...RETURNING (same validity conditions as
-- validateCoupon in lib/coupons.ts) closes the race - concurrent updates to
-- the same row serialize under Postgres MVCC, so only one can succeed once
-- max_uses is hit.

create or replace function redeem_coupon(p_coupon_id uuid)
returns table (discount_type text, discount_value numeric)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update coupons
  set uses_count = coupons.uses_count + 1
  where coupons.id = p_coupon_id
    and coupons.active
    and (coupons.expires_at is null or coupons.expires_at >= current_date)
    and (coupons.max_uses is null or coupons.uses_count < coupons.max_uses)
  returning coupons.discount_type, coupons.discount_value;
end;
$$;

grant execute on function redeem_coupon(uuid) to service_role;

-- Counterpart used to roll back a redemption if appointment creation fails
-- after the coupon use was already atomically consumed above.
create or replace function release_coupon(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update coupons set uses_count = greatest(0, uses_count - 1) where id = p_coupon_id;
$$;

grant execute on function release_coupon(uuid) to service_role;
