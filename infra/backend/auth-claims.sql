-- Restore the claim helpers after Auth initializes its legacy base migration.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
SELECT coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
SELECT coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role');
$$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$
SELECT coalesce(nullif(current_setting('request.jwt.claim.email', true), ''),
  nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email');
$$;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.role(), auth.email() TO anon, authenticated, service_role;
