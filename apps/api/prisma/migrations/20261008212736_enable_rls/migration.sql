-- This is an empty migration.-- Helper functions: read the context our API sets at the start of each transaction.
-- current_setting(..., true) returns NULL instead of an error when nothing is set.
CREATE OR REPLACE FUNCTION app_current_org() RETURNS uuid
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('app.current_org', true), '')::uuid $$;

CREATE OR REPLACE FUNCTION app_bypass_rls() RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT coalesce(current_setting('app.bypass_rls', true), '') = 'on' $$;

-- ENABLE turns RLS on. FORCE makes it apply to the table OWNER too.
-- Our app connects as the owner (rentora_app), so without FORCE the policies would be ignored.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organizations FOR ALL
  USING      (app_bypass_rls() OR id = app_current_org())
  WITH CHECK (app_bypass_rls() OR id = app_current_org());

-- The same policy for every table that carries organization_id.
-- USING      = which existing rows may be seen, updated or deleted.
-- WITH CHECK = which new or changed rows may be written.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['memberships', 'invitations', 'properties', 'property_access_grants'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I FOR ALL
         USING      (app_bypass_rls() OR organization_id = app_current_org())
         WITH CHECK (app_bypass_rls() OR organization_id = app_current_org())', t);
  END LOOP;
END $$;

-- Audit log: append-only. Policies exist for SELECT and INSERT only.
-- With no UPDATE or DELETE policy, those commands match zero rows for everyone.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_read ON audit_logs FOR SELECT
  USING (app_bypass_rls() OR organization_id = app_current_org());
CREATE POLICY audit_insert ON audit_logs FOR INSERT
  WITH CHECK (app_bypass_rls() OR organization_id = app_current_org());