# Ati TechHub / RHHub

Exportado do Bolt sb1-dglo3dqk em 23/10/2026.

Produção: https://rh.atisolution.com.br

O frontend está na VPS United, em /opt/rhhub, container rhhub-web, porta privada 18110, com Nginx e HTTPS. O backend Bolt/Supabase original continua sendo utilizado; sua migração integral está pendente. Consulte PREPARACAO.md.

## Desenvolvimento

Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env (não versionado). Execute npm ci, npm run dev e npm run build. As variáveis VITE são públicas; nunca inserir service_role no frontend.

## Infraestrutura

Dockerfile e compose.yaml permitem construir o frontend. infra/nginx.conf configura o servidor estático e fallback das rotas; infra/rh.atisolution.com.br.conf é o modelo do virtual host HTTP. O certificado e redirecionamento HTTPS são geridos pelo Certbot no host.

O backend requer Supabase: PostgreSQL, Auth, Storage e sete Edge Functions. As 22 migrações não substituem o dump dos registros atuais, identidades e objetos Storage. Credenciais fixas antigas foram substituídas por senhas aleatórias nas migrações versionadas: redefina as senhas de bootstrap quando criar uma base de homologação. Não aplicar seeds sobre produção.
