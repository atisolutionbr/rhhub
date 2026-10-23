-- Add missing auth.identities for all manually-created users
-- Without these records GoTrue cannot authenticate email/password logins

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT au.id, au.email
    FROM auth.users au
    WHERE au.email IN (
      'usu.demo@example.com',
      'emp.demo@example.com',
      'admin@example.com',
      'admin@atisolution.com.br'
    )
  LOOP
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider,
      identity_data,
      last_sign_in_at, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      rec.id,
      rec.email,
      'email',
      jsonb_build_object(
        'sub', rec.id::text,
        'email', rec.email,
        'email_verified', true,
        'phone_verified', false
      ),
      NOW(), NOW(), NOW()
    )
    ON CONFLICT (provider, provider_id) DO NOTHING;
  END LOOP;
END $$;
