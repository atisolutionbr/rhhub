/*
# Initial Schema for Ati TechJobs Hub

1. Core Tables
- `users` - Extended user profiles linked to auth.users
- `companies` - Company profiles with verification status
- `technologies` - Technology stack (React, Python, etc.)
- `categories` - Job categories (Frontend, Backend, etc.)
- `jobs` - Job listings (internal and external)
- `job_applications` - Application tracking
- `subscriptions` - User subscription plans
- `application_logs` - Daily application limit tracking
- `favorites` - Saved jobs for candidates
- `job_alerts` - Alert preferences for candidates
- `articles` - Blog articles
- `banners` - Home page banners

2. Security
- RLS enabled on all tables
- Owner-scoped policies for candidates, companies
- Public read for jobs, articles, technologies

3. Notes
- Jobs can be internal (apply in-platform) or external (redirect)
- Application limits are tracked daily per user
- Companies have verification status for trust
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Technologies table
CREATE TABLE IF NOT EXISTS technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon_url text,
  category text,
  is_popular boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Job categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type text NOT NULL DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'company', 'admin')),
  full_name text,
  avatar_url text,
  phone text,
  bio text,
  location_city text,
  location_state text,
  location_country text DEFAULT 'Brasil',
  linkedin_url text,
  github_url text,
  portfolio_url text,
  behance_url text,
  stackoverflow_url text,
  website_url text,
  is_verified boolean DEFAULT false,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  whatsapp_notifications boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Company profiles
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  cover_url text,
  description text,
  website_url text,
  linkedin_url text,
  video_url text,
  size text CHECK (size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  industry text,
  founded_year int,
  location_city text,
  location_state text,
  location_country text DEFAULT 'Brasil',
  benefits jsonb DEFAULT '[]',
  culture text,
  team_size int,
  rating numeric(3,2) DEFAULT 0,
  review_count int DEFAULT 0,
  is_verified boolean DEFAULT false,
  verification_requested_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidate profiles
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  headline text,
  summary text,
  resume_url text,
  experience jsonb DEFAULT '[]',
  education jsonb DEFAULT '[]',
  certifications jsonb DEFAULT '[]',
  languages jsonb DEFAULT '[]',
  technologies jsonb DEFAULT '[]',
  desired_salary_min int,
  desired_salary_max int,
  desired_location text,
  availability text CHECK (availability IN ('immediate', '15-days', '30-days', '60-days', 'not-looking')),
  remote_preference text CHECK (remote_preference IN ('remote', 'hybrid', 'onsite', 'any')),
  profile_completion int DEFAULT 0,
  linkedin_imported_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL,
  requirements text,
  benefits text,
  salary_min int,
  salary_max int,
  salary_currency text DEFAULT 'BRL',
  salary_period text DEFAULT 'monthly',
  location_city text,
  location_state text,
  location_country text DEFAULT 'Brasil',
  modality text NOT NULL CHECK (modality IN ('remote', 'hybrid', 'onsite')),
  seniority text CHECK (seniority IN ('junior', 'mid', 'senior', 'lead', 'manager', 'director', 'executive')),
  employment_type text CHECK (employment_type IN ('clt', 'pj', 'contractor', 'internship', 'freelance')),
  is_internal boolean NOT NULL DEFAULT true,
  external_url text,
  external_source text,
  external_id text,
  external_posted_at timestamptz,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'published', 'expired', 'closed')),
  is_featured boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  view_count int DEFAULT 0,
  application_count int DEFAULT 0,
  technologies jsonb DEFAULT '[]',
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Job applications
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn')),
  notes text,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(job_id, user_id)
);

-- Application tracking for daily limits
CREATE TABLE IF NOT EXISTS application_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  application_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Subscription plans configuration
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  price_cents int NOT NULL,
  currency text DEFAULT 'BRL',
  interval text DEFAULT 'monthly',
  max_applications_per_day int DEFAULT 2,
  is_free boolean DEFAULT false,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due')),
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Favorite jobs
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Job alerts
CREATE TABLE IF NOT EXISTS job_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  keywords jsonb DEFAULT '[]',
  technologies jsonb DEFAULT '[]',
  locations jsonb DEFAULT '[]',
  seniorities jsonb DEFAULT '[]',
  salary_min int,
  modalities jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  frequency text DEFAULT 'daily' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Blog articles
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text NOT NULL,
  cover_url text,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  category text,
  tags jsonb DEFAULT '[]',
  is_published boolean DEFAULT false,
  published_at timestamptz,
  view_count int DEFAULT 0,
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Banners
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  button_text text,
  position text DEFAULT 'hero',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_modality ON jobs(modality);
CREATE INDEX IF NOT EXISTS idx_jobs_seniority ON jobs(seniority);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON jobs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_applications_user ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_date ON application_logs(user_id, application_date);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(is_verified);
CREATE INDEX IF NOT EXISTS idx_technologies_slug ON technologies(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "users_read_own" ON users;
CREATE POLICY "users_read_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own" ON users;
CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- RLS Policies for companies - public read for verified companies
DROP POLICY IF EXISTS "companies_public_read" ON companies;
CREATE POLICY "companies_public_read" ON companies FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "companies_owner_manage" ON companies;
CREATE POLICY "companies_owner_manage" ON companies FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for candidate_profiles
DROP POLICY IF EXISTS "candidate_profiles_read_own" ON candidate_profiles;
CREATE POLICY "candidate_profiles_read_own" ON candidate_profiles FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "candidate_profiles_manage_own" ON candidate_profiles;
CREATE POLICY "candidate_profiles_manage_own" ON candidate_profiles FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for jobs - public read for approved jobs
DROP POLICY IF EXISTS "jobs_public_read" ON jobs;
CREATE POLICY "jobs_public_read" ON jobs FOR SELECT
  TO anon, authenticated USING (status IN ('approved', 'published'));

DROP POLICY IF EXISTS "jobs_company_manage" ON jobs;
CREATE POLICY "jobs_company_manage" ON jobs FOR ALL
  TO authenticated USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  ) WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

-- RLS Policies for job_applications
DROP POLICY IF EXISTS "applications_candidate_read" ON job_applications;
CREATE POLICY "applications_candidate_read" ON job_applications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "applications_company_read" ON job_applications;
CREATE POLICY "applications_company_read" ON job_applications FOR SELECT
  TO authenticated USING (
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "applications_candidate_insert" ON job_applications;
CREATE POLICY "applications_candidate_insert" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "applications_company_update" ON job_applications;
CREATE POLICY "applications_company_update" ON job_applications FOR UPDATE
  TO authenticated USING (
    job_id IN (SELECT id FROM jobs WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()))
  );

-- RLS Policies for application_logs
DROP POLICY IF EXISTS "application_logs_own" ON application_logs;
CREATE POLICY "application_logs_own" ON application_logs FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "subscriptions_own" ON subscriptions;
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscription_plans - public read
DROP POLICY IF EXISTS "plans_public_read" ON subscription_plans;
CREATE POLICY "plans_public_read" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (is_active = true);

-- RLS Policies for favorites
DROP POLICY IF EXISTS "favorites_own" ON favorites;
CREATE POLICY "favorites_own" ON favorites FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for job_alerts
DROP POLICY IF EXISTS "alerts_own" ON job_alerts;
CREATE POLICY "alerts_own" ON job_alerts FOR ALL
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for articles - public read for published
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "articles_author_manage" ON articles;
CREATE POLICY "articles_author_manage" ON articles FOR ALL
  TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

-- RLS Policies for banners - public read for active
DROP POLICY IF EXISTS "banners_public_read" ON banners;
CREATE POLICY "banners_public_read" ON banners FOR SELECT
  TO anon, authenticated USING (is_active = true);

-- RLS Policies for technologies - public read
DROP POLICY IF EXISTS "technologies_read" ON technologies;
CREATE POLICY "technologies_read" ON technologies FOR SELECT
  TO anon, authenticated USING (true);

-- RLS Policies for categories - public read
DROP POLICY IF EXISTS "categories_read" ON categories;
CREATE POLICY "categories_read" ON categories FOR SELECT
  TO anon, authenticated USING (true);