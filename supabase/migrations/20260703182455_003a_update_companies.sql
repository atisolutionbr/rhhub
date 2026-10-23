/*
# Allow null user_id for companies (demo purposes)

1. Changes
- Make companies.user_id nullable to allow demo companies
- This enables seeding sample data without auth users

2. Add sample data after schema change
*/

-- Make user_id nullable for demo purposes
ALTER TABLE companies ALTER COLUMN user_id DROP NOT NULL;

-- Now insert sample companies with null user_id
INSERT INTO companies (name, slug, logo_url, description, website_url, size, industry, location_city, location_state, is_verified, created_at)
VALUES
  ('TechCorp Brasil', 'techcorp-brasil', 'https://ui-avatars.com/api/?name=TechCorp&background=0ea5e9&color=fff&size=200', 'Empresa lider em solucoes tecnologicas', 'https://techcorp.com.br', '201-500', 'Tecnologia', 'Sao Paulo', 'SP', true, now()),
  ('DevStudio', 'devstudio', 'https://ui-avatars.com/api/?name=DevStudio&background=10b981&color=fff&size=200', 'Desenvolvimento de software agil', 'https://devstudio.io', '51-200', 'Software', 'Rio de Janeiro', 'RJ', true, now()),
  ('CloudNative', 'cloudnative', 'https://ui-avatars.com/api/?name=CloudNative&background=6366f1&color=fff&size=200', 'Infraestrutura em nuvem', 'https://cloudnative.dev', '11-50', 'Cloud', 'Curitiba', 'PR', false, now()),
  ('StartupX', 'startupx', 'https://ui-avatars.com/api/?name=StartupX&background=f59e0b&color=fff&size=200', 'Inovacao e disruptacao digital', 'https://startupx.com', '1-10', 'Fintech', 'Sao Paulo', 'SP', false, now()),
  ('DataMinds', 'dataminds', 'https://ui-avatars.com/api/?name=DataMinds&background=8b5cf6&color=fff&size=200', 'Inteligencia artificial e dados', 'https://dataminds.ai', '51-200', 'AI/ML', 'Belo Horizonte', 'MG', true, now())
ON CONFLICT (slug) DO NOTHING;