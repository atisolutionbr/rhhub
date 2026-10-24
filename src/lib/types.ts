export type UserType = "candidate" | "company" | "admin";

export interface UserProfile {
  id: string;
  user_type: UserType;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  is_verified: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  description: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  size: string | null;
  industry: string | null;
  founded_year: number | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  benefits: string[] | null;
  culture: string | null;
  team_size: number | null;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  company_id: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  modality: string | null;
  seniority: string | null;
  employment_type: string | null;
  is_internal: boolean;
  external_url: string | null;
  external_source: string | null;
  external_id: string | null;
  status: string;
  is_featured: boolean;
  is_urgent: boolean;
  view_count: number;
  application_count: number;
  technologies: string[] | null;
  category_id: string | null;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  source_id: string | null;
  data_verified?: boolean;
  source_url?: string | null;
  last_checked_at?: string | null;
  source_expires_at?: string | null;
  salary_text?: string | null;
  location_restrictions?: string[] | null;
  timezone_restrictions?: string[] | null;
  employment_type_text?: string | null;
  source_location_text?: string | null;
  company?: Company;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  category: string | null;
  is_popular: boolean;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  cover_letter: string | null;
  status: string;
  notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  applicant?: {
    full_name: string;
    email: string;
    phone: string | null;
    headline: string | null;
    resume_url: string | null;
  };
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  headline: string | null;
  summary: string | null;
  resume_url: string | null;
  experience: any[];
  education: any[];
  certifications: any[];
  languages: any[];
  technologies: any[];
  desired_salary_min: number | null;
  desired_salary_max: number | null;
  desired_location: string | null;
  availability: string | null;
  remote_preference: string | null;
  profile_completion: number;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  job?: Job;
}

export interface JobAlert {
  id: string;
  user_id: string;
  name: string;
  keywords: string[];
  technologies: string[];
  locations: string[];
  seniorities: string[];
  salary_min: number | null;
  modalities: string[];
  is_active: boolean;
  frequency: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  max_applications_per_day: number;
  is_free: boolean;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface SalaryBenchmark {
  id: string;
  role: string;
  seniority: string;
  contract_type: string;
  salary_min_brl: number;
  salary_median_brl: number;
  salary_max_brl: number;
  per_period: string;
  sample_size: number;
  source_name: string;
  source_url: string | null;
  collected_at: string;
}

export interface CompanyRanking {
  id: string;
  ranking_name: string;
  rank: number;
  company: string;
  sector: string;
  source_name: string;
  source_url: string | null;
  published_at: string;
}

export interface JobSource {
  id: string;
  name: string;
  url: string | null;
  source_type: string;
  is_active: boolean;
  config: any;
  last_synced_at: string | null;
  sync_interval_minutes: number | null;
  jobs_found_total: number;
  jobs_imported_total: number;
}

export interface ScrapingLog {
  id: string;
  source_id: string;
  source_name: string;
  status: string;
  jobs_found: number;
  jobs_imported: number;
  jobs_updated: number;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}
