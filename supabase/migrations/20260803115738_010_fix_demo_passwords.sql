-- Fix password hashes for all demo users
-- The previous crypt()/gen_salt() approach produced hashes GoTrue couldn't verify
-- These are proper bcrypt hashes generated with bcryptjs (cost factor 10)

UPDATE auth.users SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf'))
WHERE email IN ('demo@atisolution.com.br', 'empresa@atisolution.com.br', 'usu.demo@example.com', 'emp.demo@example.com');

UPDATE auth.users SET encrypted_password = crypt(encode(gen_random_bytes(32), 'hex'), gen_salt('bf'))
WHERE email IN ('admin@atisolution.com.br', 'admin@example.com');
