/*
# Create Demo Users

1. Demo users for testing:
- usu.demo (candidate) - password: #D3m0%
- emp.demo (company) - password: #D3m0%
- admin - password: 4dm1n

2. Notes
- These are test accounts for demonstration purposes
- Passwords are bcrypt hashed via Supabase Auth
*/

-- Create auth users first using Supabase auth functions
-- Note: In production, passwords should be set properly via Supabase Auth

-- For demo purposes, we'll create placeholder entries
-- Actual authentication with these passwords requires using Supabase Auth API

DO $$
BEGIN
  -- These are demonstration placeholder records
  -- In the actual Supabase environment, users would be created through the Auth API
  -- with proper password hashing
  
  -- The following INSERT statements would work if executed with proper auth setup:
  -- usu.demo@example.com -> #D3m0%
  -- emp.demo@example.com -> #D3m0%
  -- admin@example.com -> 4dm1n
  
  NULL;
END $$;

-- Instructions for creating demo users:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add user" > "Create new user"
-- 3. Create users with the following credentials:

-- Candidate Demo:
-- Email: usu.demo@example.com
-- Password: #D3m0%
-- Auto Confirm User: ON

-- Company Demo:
-- Email: emp.demo@example.com
-- Password: #D3m0%
-- Auto Confirm User: ON

-- Admin:
-- Email: admin@example.com
-- Password: 4dm1n
-- Auto Confirm User: ON

-- After creating auth users, run the following SQL to set user types:

-- UPDATE users SET user_type = 'candidate' WHERE id IN (SELECT id FROM auth.users WHERE email = 'usu.demo@example.com');
-- UPDATE users SET user_type = 'company' WHERE id IN (SELECT id FROM auth.users WHERE email = 'emp.demo@example.com');
-- UPDATE users SET user_type = 'admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');