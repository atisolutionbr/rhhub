-- Fix all NULL token fields that GoTrue expects to be empty strings
-- Working users have '' (empty string), demo users have NULL which causes auth failures

UPDATE auth.users 
SET confirmation_token = '',
    recovery_token = '',
    email_change_token_new = '',
    email_change_token_current = '',
    phone_change = '',
    phone_change_token = '',
    reauthentication_token = ''
WHERE email IN (
  'demo@atisolution.com.br',
  'empresa@atisolution.com.br',
  'admin@atisolution.com.br',
  'usu.demo@example.com',
  'emp.demo@example.com',
  'admin@example.com'
);
