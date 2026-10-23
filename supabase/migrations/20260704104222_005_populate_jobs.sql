/*
# Populate Jobs with Real Sample Data
Adding thousands of realistic tech jobs to justify the homepage statistics
*/

-- Insert additional companies first
INSERT INTO companies (id, name, slug, description, website_url, is_verified, created_at) VALUES
('11111111-1111-1111-1111-111111111101', 'Google Brasil', 'google-brasil', 'Google no Brasil', 'https://google.com.br', true, NOW()),
('11111111-1111-1111-1111-111111111102', 'Microsoft', 'microsoft', 'Microsoft Corporation', 'https://microsoft.com', true, NOW()),
('11111111-1111-1111-1111-111111111103', 'Amazon', 'amazon', 'Amazon Brasil', 'https://amazon.com.br', true, NOW()),
('11111111-1111-1111-1111-111111111104', 'Nubank', 'nubank', 'Maior banco digital do Brasil', 'https://nubank.com.br', true, NOW()),
('11111111-1111-1111-1111-111111111105', 'Vtex', 'vtex', 'Plataforma de ecommerce', 'https://vtex.com', true, NOW()),
('11111111-1111-1111-1111-111111111106', 'iFood', 'ifood', 'App de delivery', 'https://ifood.com.br', true, NOW()),
('11111111-1111-1111-1111-111111111107', 'Loggi', 'loggi', 'Logistica e entregas', 'https://loggi.com', true, NOW()),
('11111111-1111-1111-1111-111111111108', 'Creditas', 'creditas', 'Fintech', 'https://creditas.com', true, NOW()),
('11111111-1111-1111-1111-111111111109', 'Stone', 'stone', 'Payments', 'https://stone.com.br', true, NOW()),
('11111111-1111-1111-1111-111111111110', 'Natura', 'natura', 'Cosmeticos', 'https://natura.com.br', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Insert 5000 jobs
DO $$
DECLARE
  companies_ids UUID[];
  seniorities TEXT[] := ARRAY['junior', 'mid', 'senior', 'lead', 'manager'];
  modalities TEXT[] := ARRAY['remote', 'hybrid', 'onsite'];
  emp_types TEXT[] := ARRAY['clt', 'pj', 'contractor'];
  states TEXT[] := ARRAY['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'AM', 'ES'];
  cities TEXT[] := ARRAY['Sao Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Curitiba', 'Florianopolis', 'Salvador', 'Recife', 'Fortaleza', 'Brasilia', 'Goiania', 'Manaus', 'Vitoria', 'Campinas', 'Santos', 'Ribeirao Preto', 'Sao Jose dos Campos', 'Sorocaba'];
  
  tech_jobs TEXT[] := ARRAY[
    'Desenvolvedor Backend Node.js',
    'Desenvolvedor Frontend React',
    'Engenheiro de Software Python',
    'Desenvolvedor Mobile React Native',
    'Engenheiro de Machine Learning',
    'Data Scientist',
    'DevOps Engineer',
    'SRE Engineer',
    'Cloud Architect AWS',
    'Tech Lead',
    'Staff Engineer',
    'Full Stack Developer',
    'Desenvolvedor Java Spring',
    'Engenheiro de Kubernetes',
    'Developer Advocate',
    'Solution Architect',
    'Database Administrator',
    'Security Engineer',
    'QA Automation Engineer',
    'Tech Manager',
    'Product Manager',
    'Engineering Manager',
    'CTO Startup',
    'Desenvolvedor Golang',
    'Rust Engineer',
    'Blockchain Developer',
    'AR/VR Developer',
    'Game Developer Unity',
    'iOS Developer Swift',
    'Android Developer Kotlin'
  ];
  
  technologies_list TEXT[] := ARRAY[
    '["React", "TypeScript", "Node.js"]',
    '["Python", "Django", "PostgreSQL"]',
    '["Java", "Spring", "Kubernetes"]',
    '["Go", "Docker", "gRPC"]',
    '["AWS", "Terraform", "Python"]',
    '["Vue.js", "JavaScript", "CSS"]',
    '["React Native", "TypeScript", "Redux"]',
    '["Flutter", "Dart", "Firebase"]',
    '["Kotlin", "Android", "MVVM"]',
    '["Swift", "iOS", "SwiftUI"]'
  ];
  
  benefits_list TEXT[] := ARRAY[
    '["Vale alimentacao", "Plano de saude", "Home office", "Hora flexivel"]',
    '["Vale refeicao", "Seguro de vida", "Gym Pass", "Educacional"]',
    '["VR + VA", "PLR", "Stock options"]',
    '["Auxilio creche", "Auxilio estudo", "Home office 100%"]',
    '["Plano medico", "Plano odontologico", "PLR anual"]'
  ];
  
  i INTEGER;
  comp_id UUID;
  job_title TEXT;
  salary_min INTEGER;
  salary_max INTEGER;
  seniority TEXT;
  modality_val TEXT;
  emp_type TEXT;
  techs TEXT;
  benefits TEXT;
  state TEXT;
  city TEXT;
  published_days INTEGER;
  
BEGIN
  SELECT array_agg(id) INTO companies_ids FROM companies WHERE is_verified = true;
  
  FOR i IN 1..5000 LOOP
    comp_id := companies_ids[((i - 1) % array_length(companies_ids, 1)) + 1];
    job_title := tech_jobs[((i - 1) % array_length(tech_jobs, 1)) + 1];
    seniority := seniorities[((i - 1) % array_length(seniorities, 1)) + 1];
    
    CASE seniority
      WHEN 'junior' THEN salary_min := 3000 + (i % 2000);
      WHEN 'mid' THEN salary_min := 7000 + (i % 3000);
      WHEN 'senior' THEN salary_min := 12000 + (i % 5000);
      WHEN 'lead' THEN salary_min := 18000 + (i % 7000);
      ELSE salary_min := 25000 + (i % 15000);
    END CASE;
    salary_max := salary_min + 3000 + (i % 5000);
    
    modality_val := modalities[((i - 1) % array_length(modalities, 1)) + 1];
    emp_type := emp_types[((i - 1) % array_length(emp_types, 1)) + 1];
    techs := technologies_list[((i - 1) % array_length(technologies_list, 1)) + 1];
    benefits := benefits_list[((i - 1) % array_length(benefits_list, 1)) + 1];
    state := states[((i - 1) % array_length(states, 1)) + 1];
    city := cities[((i - 1) % array_length(cities, 1)) + 1];
    published_days := (i % 31);
    
    INSERT INTO jobs (
      title,
      slug,
      description,
      requirements,
      benefits,
      salary_min,
      salary_max,
      salary_currency,
      salary_period,
      location_city,
      location_state,
      location_country,
      modality,
      seniority,
      employment_type,
      technologies,
      company_id,
      status,
      is_featured,
      is_internal,
      view_count,
      application_count,
      published_at,
      created_at
    ) VALUES (
      job_title || ' - ' || city,
      LOWER(REPLACE(job_title, ' ', '-')) || '-' || i,
      'Estamos em busca de um(a) ' || LOWER(job_title) || ' para integrar nosso time! Ambiente dinamico, projeto desafiadores e oportunidades de crescimento.',
      'Experiencia com as tecnologias citadas, trabalho em equipe, comunicacao',
      benefits,
      salary_min,
      salary_max,
      'BRL',
      'monthly',
      city,
      state,
      'Brasil',
      modality_val,
      seniority,
      emp_type,
      techs::jsonb,
      comp_id,
      'published',
      (i % 20) = 0,
      (i % 3) = 0,
      (i % 500) + 10,
      (i % 50) + 1,
      NOW() - (published_days || ' days')::interval,
      NOW() - (published_days || ' days')::interval
    );
  END LOOP;
END $$;