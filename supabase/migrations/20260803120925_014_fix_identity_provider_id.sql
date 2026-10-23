-- Fix provider_id in auth.identities — GoTrue expects provider_id to be the user's UUID, not their email
-- This was causing 500 "Database error querying schema" on login

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT i.id as identity_id, i.user_id, au.email
    FROM auth.identities i
    JOIN auth.users au ON i.user_id = au.id
    WHERE i.provider = 'email'
      AND i.provider_id != au.id::text
  LOOP
    UPDATE auth.identities 
    SET provider_id = rec.user_id::text,
        identity_data = jsonb_build_object(
          'sub', rec.user_id::text,
          'email', rec.email,
          'email_verified', true,
          'phone_verified', false
        )
    WHERE id = rec.identity_id;
  END LOOP;
END $$;
