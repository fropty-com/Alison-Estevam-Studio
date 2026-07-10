-- ═══════════════════════════════════════════════════════════
-- Grant base table privileges to anon/authenticated/service_role
-- Migration: 006_grant_table_privileges
--
-- ROOT CAUSE FOUND DURING AUDIT: every table in `public` only had
-- REFERENCES/TRIGGER/TRUNCATE granted to anon, authenticated, and
-- service_role — SELECT/INSERT/UPDATE/DELETE were never granted at
-- all, on ANY table, for ANY role (including service_role). RLS
-- policies were correctly defined, but Postgres checks base table
-- grants before RLS ever runs, so every query from every client
-- (including the "service role" server client) was being rejected
-- with "permission denied for table X" — regardless of which API
-- key was configured. This is why the site fell back to hardcoded
-- demo data instead of showing real services/pricing.
--
-- This restores Supabase's standard default privilege scheme:
-- anon reads only (gated further by RLS), authenticated can also
-- write (gated by RLS), service_role has full access (bypasses RLS).
-- ═══════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure any table created in the future keeps the same defaults
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
