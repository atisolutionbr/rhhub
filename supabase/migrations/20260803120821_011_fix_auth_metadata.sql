-- Fix raw_app_meta_data for demo users — GoTrue requires provider info to authenticate
-- Also fix raw_user_meta_data to include email_verified flag

UPDATE auth.users 
SET raw_app_meta_data = '{"provider":"email","providers":["email"]}',
    raw_user_meta_data = '{"email_verified":true}'
WHERE email IN (
  'demo@atisolution.com.br',
  'empresa@atisolution.com.br',
  'admin@atisolution.com.br',
  'usu.demo@example.com',
  'emp.demo@example.com',
  'admin@example.com'
);
