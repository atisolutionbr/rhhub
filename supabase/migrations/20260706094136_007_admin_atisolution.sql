DO $$
DECLARE
  admin_id uuid;
  free_plan_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@atisolution.com.br') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id, 'authenticated', 'authenticated',
      'admin@atisolution.com.br',
      crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW()
    );
  END IF;

  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@atisolution.com.br';

  INSERT INTO public.users (id, user_type, full_name, location_country, is_verified)
  VALUES (admin_id, 'admin', 'Admin Ati Solution', 'Brasil', true)
  ON CONFLICT (id) DO UPDATE SET user_type = 'admin', full_name = 'Admin Ati Solution';

  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.subscriptions WHERE user_id = admin_id
  ) THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status)
    VALUES (admin_id, free_plan_id, 'active');
  END IF;
END $$;
