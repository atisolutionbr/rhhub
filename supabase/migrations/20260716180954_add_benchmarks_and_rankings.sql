/*
# Add salary_benchmarks and company_rankings tables

## Overview
Adds two new tables to store REAL Brazilian tech salary benchmarks and REAL company
rankings, sourced from public research (Robert Half Guide 2026, Portal Salário/CAGED,
Glassdoor, GeekHunter, Código Fonte TV Pesquisa Salarial 2025, LinkedIn Top Companies 2025).

## New Tables

1. `salary_benchmarks` — REAL Brazilian tech salary data per role + seniority.
   - id (uuid pk)
   - role (text) — e.g. "Desenvolvedor Back-end"
   - seniority (text) — junior | pleno | senior | tech_lead | staff
   - contract_type (text default CLT) — CLT | PJ
   - salary_min_brl (int) — monthly BRL, minimum of range
   - salary_median_brl (int) — median
   - salary_max_brl (int) — maximum of range
   - per_period (text default 'month') — month | hour | day
   - sample_size (int, nullable) — number of professionals in the source survey
   - source_name (text) — e.g. "Robert Half", "Portal Salário (CAGED)", "Glassdoor"
   - source_url (text)
   - collected_at (date) — when the source published the data
   - notes (text, nullable)
   - created_at (timestamptz default now())

2. `company_rankings` — REAL rankings of tech employers in Brazil.
   - id (uuid pk)
   - ranking_name (text) — e.g. "LinkedIn Top Companies 2025 — Brasil"
   - rank (int)
   - company (text)
   - sector (text, nullable) — e.g. Tecnologia, Finanças, Varejo
   - source_name (text)
   - source_url (text)
   - published_at (date)
   - notes (text, nullable)
   - created_at (timestamptz default now())

## Security (RLS)
This app has NO sign-in screen — it is a public job board. Both tables use
`TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is
intentionally public/shared.

## Important notes
1. Salary values are integers in BRL per month (e.g. 12000 = R$ 12.000/mês).
2. The frontend will derive hourly (salary / 220) and daily (salary / 30) rates from the
   monthly figure to display per-hour/per-day context as the user requested.
3. All data is seeded from real public sources — no fabricated numbers.
*/

CREATE TABLE IF NOT EXISTS salary_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  seniority text NOT NULL CHECK (seniority IN ('junior','pleno','senior','tech_lead','staff')),
  contract_type text NOT NULL DEFAULT 'CLT' CHECK (contract_type IN ('CLT','PJ')),
  salary_min_brl int NOT NULL,
  salary_median_brl int NOT NULL,
  salary_max_brl int NOT NULL,
  per_period text NOT NULL DEFAULT 'month' CHECK (per_period IN ('month','hour','day')),
  sample_size int,
  source_name text NOT NULL,
  source_url text NOT NULL,
  collected_at date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE salary_benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_salary_benchmarks" ON salary_benchmarks;
CREATE POLICY "public_read_salary_benchmarks" ON salary_benchmarks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_salary_benchmarks" ON salary_benchmarks;
CREATE POLICY "public_insert_salary_benchmarks" ON salary_benchmarks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_salary_benchmarks" ON salary_benchmarks;
CREATE POLICY "public_update_salary_benchmarks" ON salary_benchmarks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_salary_benchmarks" ON salary_benchmarks;
CREATE POLICY "public_delete_salary_benchmarks" ON salary_benchmarks FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS salary_benchmarks_role_idx ON salary_benchmarks (role);
CREATE INDEX IF NOT EXISTS salary_benchmarks_seniority_idx ON salary_benchmarks (seniority);

CREATE TABLE IF NOT EXISTS company_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_name text NOT NULL,
  rank int NOT NULL,
  company text NOT NULL,
  sector text,
  source_name text NOT NULL,
  source_url text NOT NULL,
  published_at date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE company_rankings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_company_rankings" ON company_rankings;
CREATE POLICY "public_read_company_rankings" ON company_rankings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "public_insert_company_rankings" ON company_rankings;
CREATE POLICY "public_insert_company_rankings" ON company_rankings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "public_update_company_rankings" ON company_rankings;
CREATE POLICY "public_update_company_rankings" ON company_rankings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "public_delete_company_rankings" ON company_rankings;
CREATE POLICY "public_delete_company_rankings" ON company_rankings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS company_rankings_name_idx ON company_rankings (ranking_name, rank);
