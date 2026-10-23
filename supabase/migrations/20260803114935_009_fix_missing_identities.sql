-- Add missing auth.identities for demo users created without them
-- GoTrue requires an identity row for email/password login to work

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN auth.identities i ON au.id = i.user_id
    WHERE i.user_id IS NULL
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
