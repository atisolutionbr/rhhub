/*
# Add Sample Jobs

1. Internal Jobs
- Multiple tech positions from sample companies

2. External Jobs  
- Jobs aggregated from external sources (LinkedIn, Indeed, etc.)

3. Notes
- Salaries in cents (multiply by 100)
- All jobs have status 'published'
*/

DO $$
DECLARE
  techcorp_id uuid;
  devstudio_id uuid;
  cloudnative_id uuid;
  startupx_id uuid;
  dataminds_id uuid;
BEGIN
  SELECT id INTO techcorp_id FROM companies WHERE slug = 'techcorp-brasil';
  SELECT id INTO devstudio_id FROM companies WHERE slug = 'devstudio';
  SELECT id INTO cloudnative_id FROM companies WHERE slug = 'cloudnative';
  SELECT id INTO startupx_id FROM companies WHERE slug = 'startupx';
  SELECT id INTO dataminds_id FROM companies WHERE slug = 'dataminds';

  -- TechCorp Jobs
  IF techcorp_id IS NOT NULL THEN
    INSERT INTO jobs (company_id, title, slug, description, requirements, benefits, salary_min, salary_max, location_city, location_state, modality, seniority, employment_type, is_internal, status, technologies, is_featured, is_urgent, published_at)
    VALUES
      (techcorp_id, 'Desenvolvedor Full Stack Senior', 'dev-fullstack-senior-techcorp', 'Buscamos um desenvolvedor Full Stack com experiencia em React e Node.js para liderar projetos inovadores.', 'React, Node.js, TypeScript, PostgreSQL, AWS, Docker', 'Vale alimentacao, plano de saude, trabalho remoto, 13 salario, bonus', 12000000, 18000000, 'Sao Paulo', 'SP', 'hybrid', 'senior', 'clt', true, 'published', '["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]', true, false, now()),
      (techcorp_id, 'Engenheiro de Dados', 'engenheiro-dados-techcorp', 'Oportunidade para engenheiro de dados construir pipelines escalaveis.', 'Python, Spark, Airflow, Kafka, SQL avancado', 'Plano de carreira, seguro de vida, vale refeicao, academia', 15000000, 20000000, 'Sao Paulo', 'SP', 'remote', 'senior', 'pj', true, 'published', '["Python", "Spark", "Airflow", "Kafka", "SQL"]', false, true, now()),
      (techcorp_id, 'DevOps Engineer', 'devops-engineer-techcorp', 'Procuramos profissional para gerenciar infraestrutura em nuvem.', 'AWS, Kubernetes, Terraform, GitLab CI, Linux', 'Trabalho remoto, notebook, cursos pagos', 13000000, 17000000, 'Sao Paulo', 'SP', 'remote', 'mid', 'clt', true, 'published', '["AWS", "Kubernetes", "Terraform", "Docker", "Linux"]', false, false, now());
  END IF;

  -- DevStudio Jobs
  IF devstudio_id IS NOT NULL THEN
    INSERT INTO jobs (company_id, title, slug, description, requirements, benefits, salary_min, salary_max, location_city, location_state, modality, seniority, employment_type, is_internal, status, technologies, is_featured, is_urgent, published_at)
    VALUES
      (devstudio_id, 'Desenvolvedor Front-end React', 'dev-frontend-react-devstudio', 'Desenvolvedor Front-end para criar interfaces modernas.', 'React, TypeScript, Tailwind CSS, testes automatizados', 'Vale alimentacao, home office, participacao nos lucros', 8000000, 12000000, 'Rio de Janeiro', 'RJ', 'hybrid', 'mid', 'clt', true, 'published', '["React", "TypeScript", "Tailwind CSS", "Jest"]', true, false, now()),
      (devstudio_id, 'Tech Lead', 'tech-lead-devstudio', 'Lideranca tecnica de equipe de desenvolvimento.', 'Lideranca tecnica, React, Node.js, AWS, arquitetura', 'Plano de saude, PL, bonus trimestral', 20000000, 28000000, 'Rio de Janeiro', 'RJ', 'hybrid', 'lead', 'clt', true, 'published', '["React", "Node.js", "AWS", "Arquitetura", "Lideranca"]', true, true, now()),
      (devstudio_id, 'Desenvolvedor Mobile React Native', 'dev-mobile-devstudio', 'Desenvolvimento de apps mobile cross-platform.', 'React Native, TypeScript, publicacao nas stores, APIs REST', 'GymPass, vale refeicao, MacBook', 9000000, 13000000, 'Rio de Janeiro', 'RJ', 'remote', 'mid', 'pj', true, 'published', '["React Native", "TypeScript", "iOS", "Android"]', false, false, now());
  END IF;

  -- CloudNative Jobs
  IF cloudnative_id IS NOT NULL THEN
    INSERT INTO jobs (company_id, title, slug, description, requirements, benefits, salary_min, salary_max, location_city, location_state, modality, seniority, employment_type, is_internal, status, technologies, is_featured, is_urgent, published_at)
    VALUES
      (cloudnative_id, 'SRE Engineer', 'sre-engineer-cloudnative', 'Engenheiro de Site Reliability para sistemas criticos.', 'Kubernetes, Prometheus, Grafana, Terraform, SLOs', '100% remoto, conferencias internacionais', 16000000, 22000000, 'Curitiba', 'PR', 'remote', 'senior', 'pj', true, 'published', '["Kubernetes", "Prometheus", "Grafana", "Terraform", "SRE"]', true, false, now()),
      (cloudnative_id, 'Cloud Architect', 'cloud-architect-cloudnative', 'Arquiteto de nuvem para solucoes escalaveis.', 'Certificacao AWS/GCP, microsservicos, serverless', 'Salario competitivo, acoes, bootcamps', 25000000, 35000000, 'Curitiba', 'PR', 'remote', 'senior', 'pj', true, 'published', '["AWS", "GCP", "Serverless", "Microsservicos"]', false, true, now());
  END IF;

  -- StartupX Jobs
  IF startupx_id IS NOT NULL THEN
    INSERT INTO jobs (company_id, title, slug, description, requirements, benefits, salary_min, salary_max, location_city, location_state, modality, seniority, employment_type, is_internal, status, technologies, is_featured, is_urgent, published_at)
    VALUES
      (startupx_id, 'Desenvolvedor Backend Python', 'dev-backend-python-startupx', 'Backend developer para APIs escalaveis em fintech.', 'Python, FastAPI, PostgreSQL, Redis', 'Equity, salario competitivo', 10000000, 15000000, 'Sao Paulo', 'SP', 'hybrid', 'mid', 'pj', true, 'published', '["Python", "FastAPI", "PostgreSQL", "Redis"]', false, false, now()),
      (startupx_id, 'Desenvolvedor Junior Python', 'dev-junior-python-startupx', 'Oportunidade para desenvolvedor junior em fintech.', 'Python basico, SQL, vontade de aprender', 'Treinamento, mentoria, plano de saude', 6000000, 8000000, 'Sao Paulo', 'SP', 'hybrid', 'junior', 'clt', true, 'published', '["Python", "SQL", "Git"]', false, false, now());
  END IF;

  -- DataMinds Jobs
  IF dataminds_id IS NOT NULL THEN
    INSERT INTO jobs (company_id, title, slug, description, requirements, benefits, salary_min, salary_max, location_city, location_state, modality, seniority, employment_type, is_internal, status, technologies, is_featured, is_urgent, published_at)
    VALUES
      (dataminds_id, 'Cientista de Dados Senior', 'cientista-dados-senior-dataminds', 'Cientista de dados para modelos de ML e IA.', 'Python, TensorFlow/PyTorch, NLP ou Computer Vision', 'Pesquisa aplicada, conferencias, papers', 18000000, 28000000, 'Belo Horizonte', 'MG', 'remote', 'senior', 'pj', true, 'published', '["Python", "TensorFlow", "PyTorch", "Machine Learning", "NLP"]', true, false, now()),
      (dataminds_id, 'Engenheiro de ML', 'engenheiro-ml-dataminds', 'ML Engineer para deploy e manutencao de modelos.', 'MLflow, Kubernetes, Python, Docker, MLOps', 'Ambiente inovacao, home office', 14000000, 20000000, 'Belo Horizonte', 'MG', 'hybrid', 'senior', 'clt', true, 'published', '["Python", "MLflow", "Kubernetes", "MLOps", "Docker"]', false, false, now()),
      (dataminds_id, 'Analista de Dados', 'analista-dados-dataminds', 'Analista para insights e dashboards.', 'SQL avancado, Python, Tableau ou Power BI', 'Plano de carreira, cursos', 8000000, 12000000, 'Belo Horizonte', 'MG', 'hybrid', 'mid', 'clt', true, 'published', '["SQL", "Python", "Tableau", "Power BI", "Estatistica"]', false, false, now());
  END IF;END $$;

-- External Jobs (aggregated from job boards)
INSERT INTO jobs (title, slug, description, location_city, location_state, modality, seniority, employment_type, is_internal, external_url, external_source, status, technologies, is_featured, is_urgent, published_at)
VALUES
  ('Desenvolvedor Java Spring', 'dev-java-spring-linkedin-001', 'Desenvolvedor Java com Spring Boot para projeto enterprise.', 'Sao Paulo', 'SP', 'hybrid', 'senior', 'clt', false, 'https://www.linkedin.com/jobs/', 'LinkedIn Jobs', 'published', '["Java", "Spring Boot", "PostgreSQL", "Docker"]', false, false, now()),
  ('Analista de Sistemas', 'analista-sistemas-indeed-002', 'Analista de sistemas para requisitos e documentacao.', 'Rio de Janeiro', 'RJ', 'hybrid', 'mid', 'clt', false, 'https://www.indeed.com.br/', 'Indeed', 'published', '["UML", "SQL", "Business Analysis", "Jira"]', false, false, now()),
  ('DevOps Cloud AWS', 'devops-aws-glassdoor-003', 'DevOps Engineer com foco em AWS e automatismo.', 'Porto Alegre', 'RS', 'remote', 'senior', 'pj', false, 'https://www.glassdoor.com/', 'Glassdoor', 'published', '["AWS", "Terraform", "Kubernetes", "CI/CD"]', true, true, now()),
  ('Product Manager', 'product-manager-geekhunter-004', 'Product Manager para produto digital em startup.', 'Sao Paulo', 'SP', 'hybrid', 'senior', 'clt', false, 'https://www.geekhunter.com.br/', 'GeekHunter', 'published', '["Product Management", "Agile", "Roadmap", "Data Analysis"]', false, false, now()),
  ('QA Engineer', 'qa-engineer-programathor-005', 'Engenheiro de QA para automatismo de testes.', 'Florianopolis', 'SC', 'remote', 'mid', 'pj', false, 'https://programathor.com.br/', 'Programathor', 'published', '["Cypress", "Selenium", "Testing", "Jest"]', false, false, now()),
  ('Desenvolvedor Node.js', 'dev-nodejs-trampos-006', 'Desenvolvedor Node.js backend escalavel.', 'Sao Paulo', 'SP', 'remote', 'mid', 'pj', false, 'https://trampos.co/', 'Trampos', 'published', '["Node.js", "Express", "MongoDB", "Redis"]', false, false, now()),
  ('UX Designer Senior', 'ux-designer-revelo-007', 'UX Designer para experiencias incriveis.', 'Sao Paulo', 'SP', 'hybrid', 'senior', 'clt', false, 'https://revelo.com/', 'Revelo', 'published', '["Figma", "UX Research", "Prototyping", "Design Thinking"]', false, false, now()),
  ('Engenheiro de Software', 'eng-software-apinfo-008', 'Engenheiro de software para sistemas complexos.', 'Campinas', 'SP', 'onsite', 'senior', 'clt', false, 'https://www.apinfo.com/', 'APInfo', 'published', '["Java", "Python", "SQL", "Agile"]', false, false, now()),
  ('Desenvolvedor PHP Laravel', 'dev-php-laravel-catho-009', 'Desenvolvedor PHP com Laravel para sistemas web.', 'Sao Paulo', 'SP', 'hybrid', 'mid', 'clt', false, 'https://www.catho.com.br/', 'Catho', 'published', '["PHP", "Laravel", "MySQL", "Vue.js"]', false, false, now()),
  ('Engenheiro de Dados Junior', 'eng-dados-junior-infojobs-010', 'Engenheiro de dados junior para aprender e crescer.', 'Sao Paulo', 'SP', 'hybrid', 'junior', 'clt', false, 'https://www.infojobs.com.br/', 'InfoJobs', 'published', '["Python", "SQL", "ETL", "Cloud"]', false, false, now());
