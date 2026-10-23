# Implantação — 23/10/2026

Frontend publicado em https://rh.atisolution.com.br com HTTPS Let's Encrypt e renovação automática.

- VPS: /opt/rhhub; container rhhub-web; bind 127.0.0.1:18110.
- Nginx: /etc/nginx/sites-available/rh.atisolution.com.br.
- Backend: conexão original Bolt/Supabase preservada. Banco, Auth, Storage e funções ainda não migrados para VPS.
- Build TypeScript e Vite aprovado; home consultou as 5.028 vagas e 15 empresas do backend original.
- Cadastro na cópia do código limitado a candidate/company; função ainda não implantada no backend original.
- 22 migrações e 7 funções preservadas. Senhas/hash fixos substituídos por credenciais aleatórias nas migrações versionadas; uma base criada com esses seeds exige redefinir senhas. Não usar seeds como cópia dos dados de produção.
- npm ci apontou 16 vulnerabilidades; análise e atualização pendentes.
- Chave privada e .env excluídos do Git.

A implantação integral permanece pendente do dump consistente do banco, usuários Auth, Storage e configurações das funções. O frontend publicado depende do backend original.
