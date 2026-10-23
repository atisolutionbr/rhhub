/*
# Create salary_research table

1. New Tables
- `salary_research` — stores anonymous salary survey submissions from users
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable, references auth.users)
  - `role` (text, not null) — job title from CBO list
  - `current_salary` (numeric, nullable) — current salary in BRL
  - `company_name` (text, nullable)
  - `cnpj` (text, nullable)
  - `fair_salary` (numeric, nullable) — what the person considers fair
  - `experience_years` (text, nullable)
  - `education_level` (text, nullable)
  - `modality` (text, nullable) — remote/hybrid/onsite
  - `state` (text, nullable)
  - `created_at` (timestamptz, default now())
2. Security
- Enable RLS on `salary_research`.
- Allow authenticated users to insert their own research data.
- Allow anon users to insert (since the form is public).
- All rows are readable by anyone (public benchmark data).
*/

CREATE TABLE IF NOT EXISTS salary_research (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role text NOT NULL,
  current_salary numeric,
  company_name text,
  cnpj text,
  fair_salary numeric,
  experience_years text,
  education_level text,
  modality text,
  state text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE salary_research ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_salary_research" ON salary_research;
CREATE POLICY "anon_insert_salary_research" ON salary_research FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_select_salary_research" ON salary_research;
CREATE POLICY "anon_select_salary_research" ON salary_research FOR SELECT
  TO anon, authenticated USING (true);
