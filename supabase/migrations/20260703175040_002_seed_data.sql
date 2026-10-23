/*
# Seed Subscription Plans

1. Initial Plans
- Free (2 applications/day)
- Start (5 applications/day) - R$ 12.99/month
- Plus (10 applications/day) - R$ 26.99/month
- Pro (25 applications/day) - R$ 33.99/month
- Elite (50 applications/day) - R$ 49.99/month
- Unlimited (unlimited) - R$ 109.99/month

2. Notes
- Free plan is default for all new users
- Plans are displayed in Portuguese for Brazilian market
*/

INSERT INTO subscription_plans (name, slug, description, price_cents, max_applications_per_day, is_free, features, sort_order) VALUES
('Gratuito', 'free', 'Plano inicial para começar sua jornada', 0, 2, true, '["2 candidaturas por dia", "Acesso a todas as vagas", "Alertas de vagas por email"]', 1),
('Start', 'start', 'Para candidatos ativos em busca de oportunidades', 1299, 5, false, '["5 candidaturas por dia", "Acesso a todas as vagas", "Alertas de vagas por email", "Perfil destacado", "Suporte prioritário"]', 2),
('Plus', 'plus', 'Para candidatos dedicados em transição de carreira', 2699, 10, false, '["10 candidaturas por dia", "Acesso a todas as vagas", "Alertas de vagas por email/WhatsApp", "Perfil destacado", "Currículo ilimitado", "Relatório de visualizações"]', 3),
('Pro', 'pro', 'Para profissionais em busca intensiva de emprego', 3399, 25, false, '["25 candidaturas por dia", "Acesso a todas as vagas", "Alertas ilimitados", "Perfil destaque máximo", "Currículo ilimitado", "Relatórios completos", "Match IA"]', 4),
('Elite', 'elite', 'Para executivos e profissionais seniores', 4999, 50, false, '["50 candidaturas por dia", "Acesso antecipado a novas vagas", "Alertas ilimitados", "Perfil destaque VIP", "Currículo ilimitado", "Relatórios completos", "Match IA avançado", "Consultoria de carreira"]', 5),
('Unlimited', 'unlimited', 'Acesso total sem limitações', 10999, 1000, false, '["Candidaturas ilimitadas", "Acesso antecipado a todas as vagas", "Alertas ilimitados", "Perfil destaque premium", "Currículo ilimitado", "Relatórios completos", "Match IA avançado", "Consultoria de carreira", "Suporte VIP 24/7"]', 6)
ON CONFLICT (slug) DO NOTHING;

/*
# Seed Initial Categories and Technologies

1. Job Categories
- Development (Frontend, Backend, Mobile, etc)
- Data Science & Analytics
- DevOps & Infrastructure
- Product & Design
- Leadership & Management

2. Popular Technologies
- Programming languages
- Frameworks
- Cloud platforms
- Tools
*/

INSERT INTO categories (name, slug, description, sort_order) VALUES
('Desenvolvimento', 'desenvolvimento', 'Vagas de desenvolvimento de software', 1),
('Frontend', 'frontend', 'Desenvolvimento frontend', 2),
('Backend', 'backend', 'Desenvolvimento backend', 3),
('Mobile', 'mobile', 'Desenvolvimento mobile', 4),
('Full Stack', 'full-stack', 'Desenvolvimento full stack', 5),
('Data Science', 'data-science', 'Ciência de dados e analytics', 6),
('DevOps', 'devops', 'DevOps e infraestrutura', 7),
('QA & Testing', 'qa-testing', 'Qualidade e testes', 8),
('Product', 'product', 'Gestão de produto', 9),
('Design', 'design', 'Design UX/UI e produto', 10),
('Leadership', 'leadership', 'Liderança e gestão', 11),
('Security', 'security', 'Segurança da informação', 12)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO technologies (name, slug, category, is_popular) VALUES
('JavaScript', 'javascript', 'Languages', true),
('TypeScript', 'typescript', 'Languages', true),
('Python', 'python', 'Languages', true),
('Java', 'java', 'Languages', true),
('C#', 'csharp', 'Languages', true),
('Go', 'go', 'Languages', false),
('Rust', 'rust', 'Languages', false),
('PHP', 'php', 'Languages', false),
('Ruby', 'ruby', 'Languages', false),
('Kotlin', 'kotlin', 'Languages', true),
('Swift', 'swift', 'Languages', true),
('React', 'react', 'Frontend', true),
('Vue.js', 'vuejs', 'Frontend', true),
('Angular', 'angular', 'Frontend', true),
('Next.js', 'nextjs', 'Frontend', true),
('Nuxt.js', 'nuxtjs', 'Frontend', false),
('Svelte', 'svelte', 'Frontend', false),
('Node.js', 'nodejs', 'Backend', true),
('Django', 'django', 'Backend', true),
('FastAPI', 'fastapi', 'Backend', true),
('Spring Boot', 'spring-boot', 'Backend', true),
('.NET', 'dotnet', 'Backend', true),
('Express.js', 'expressjs', 'Backend', false),
('NestJS', 'nestjs', 'Backend', false),
('Ruby on Rails', 'ruby-on-rails', 'Backend', false),
('React Native', 'react-native', 'Mobile', true),
('Flutter', 'flutter', 'Mobile', true),
('iOS', 'ios', 'Mobile', true),
('Android', 'android', 'Mobile', true),
('AWS', 'aws', 'Cloud', true),
('Google Cloud', 'gcp', 'Cloud', true),
('Azure', 'azure', 'Cloud', true),
('Docker', 'docker', 'DevOps', true),
('Kubernetes', 'kubernetes', 'DevOps', true),
('Terraform', 'terraform', 'DevOps', false),
('PostgreSQL', 'postgresql', 'Database', true),
('MySQL', 'mysql', 'Database', true),
('MongoDB', 'mongodb', 'Database', true),
('Redis', 'redis', 'Database', true),
('Elasticsearch', 'elasticsearch', 'Database', false),
('GraphQL', 'graphql', 'API', true),
('REST API', 'rest-api', 'API', true),
('Git', 'git', 'Tools', true),
('CI/CD', 'ci-cd', 'DevOps', true),
('Agile', 'agile', 'Methodology', true),
('Scrum', 'scrum', 'Methodology', true),
('Machine Learning', 'machine-learning', 'AI', true),
('Data Science', 'data-science', 'AI', true)
ON CONFLICT (slug) DO NOTHING;