-- Create demo users in auth.users

DO $$
DECLARE
  candidate_id uuid;
  company_id uuid;
  admin_id uuid;
  free_plan_id uuid;
BEGIN
  -- Candidate demo user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'usu.demo@example.com') THEN
    candidate_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      candidate_id, 'authenticated', 'authenticated',
      'usu.demo@example.com', crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW()
    );
  END IF;
  SELECT id INTO candidate_id FROM auth.users WHERE email = 'usu.demo@example.com';

  -- Company demo user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'emp.demo@example.com') THEN
    company_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      company_id, 'authenticated', 'authenticated',
      'emp.demo@example.com', crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW()
    );
  END IF;
  SELECT id INTO company_id FROM auth.users WHERE email = 'emp.demo@example.com';

  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    admin_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id, 'authenticated', 'authenticated',
      'admin@example.com', crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf')),
      NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{}',
      NOW(), NOW()
    );
  END IF;
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com';

  -- Public user profiles
  INSERT INTO public.users (id, user_type, full_name, location_country, is_verified)
  VALUES (candidate_id, 'candidate', 'Demo Candidato', 'Brasil', true)
  ON CONFLICT (id) DO UPDATE SET user_type = 'candidate';

  INSERT INTO public.users (id, user_type, full_name, location_country, is_verified)
  VALUES (company_id, 'company', 'Demo Empresa', 'Brasil', true)
  ON CONFLICT (id) DO UPDATE SET user_type = 'company';

  INSERT INTO public.users (id, user_type, full_name, location_country, is_verified)
  VALUES (admin_id, 'admin', 'Administrador', 'Brasil', true)
  ON CONFLICT (id) DO UPDATE SET user_type = 'admin';

  -- Candidate profile (check first)
  IF NOT EXISTS (SELECT 1 FROM public.candidate_profiles WHERE user_id = candidate_id) THEN
    INSERT INTO public.candidate_profiles (user_id, experience, education, certifications, languages, technologies)
    VALUES (candidate_id, '[]', '[]', '[]', '[]', '[]');
  END IF;

  -- Free plan subscriptions (check first)
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE slug = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = candidate_id) THEN
      INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (candidate_id, free_plan_id, 'active');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = company_id) THEN
      INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (company_id, free_plan_id, 'active');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = admin_id) THEN
      INSERT INTO public.subscriptions (user_id, plan_id, status) VALUES (admin_id, free_plan_id, 'active');
    END IF;
  END IF;
END $$;
