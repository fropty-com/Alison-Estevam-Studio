-- Both a whole-day-off (blocked_periods + addBlockedPeriod/removeBlockedPeriod)
-- and a manual time-range block (blockTimeRange/unblockTimeRange) mark the
-- same time_slots.status = 'blocked', with nothing distinguishing which one
-- caused it. Removing a day-off restored every 'blocked' slot in that date
-- range back to 'available' - including ones a manual block had put there
-- for an unrelated reason, silently un-blocking them too.
--
-- blocked_period_id ties a blocked slot back to the specific day-off period
-- that blocked it (null for manual blocks), so removing one period only
-- ever restores the slots it itself blocked.

alter table time_slots
  add column blocked_period_id uuid references blocked_periods(id) on delete set null;
