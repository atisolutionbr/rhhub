# Implantação e revisão — 23/10/2026

Aplicação: https://rh.atisolution.com.br
Repositório: https://github.com/atisolutionbr/rhhub

## Produção r4

Frontend conectado ao backend da VPS por HTTPS em /backend. PostgreSQL, Auth, REST, Storage e sete funções executam no projeto isolado rhhub-backend. A página inicial carregou 5.028 vagas e 15 empresas no navegador.

Exportação administrativa por SQL sem transferência Claim: 20 tabelas, oito usuários Auth, oito identidades e metadados de um currículo privado. Dados restaurados e hashes de senha preservados. Backups integrais privados fora do Git; backup PostgreSQL pré-troca gerado e conferido.

Migrações 021 e 022 aplicadas na VPS para proteger privilégios, assinaturas e importadores. Doze verificações do banco passaram. Cadastro, login por senha, upload/download privado, isolamento entre candidatos e extração de texto, PDF e DOCX passaram com dados temporários removidos ao final. Auth, PostgreSQL e Storage apresentam healthchecks saudáveis.

## Revisão da aplicação

Build TypeScript/Vite aprovado; dependências atualizadas e nove testes de acesso/cache aprovados na revisão r2. Rotas privadas exigem perfil e papel correspondentes. Cache offline restrito a conteúdo público. Cadastro exige oito caracteres. Gráficos da empresa usam dados reais. Nginx protege arquivos ocultos e aplica cache adequado a HTML, service worker e assets versionados. Versões anteriores preservadas para rollback.

## Pendências

Falta o binário de um currículo privado; a referência foi preservada. A conta demo não é dona desse arquivo. Preservar o backend original até recuperar o documento.

As senhas originais foram preservadas; a migração não redefine uma senha esquecida. SMTP de recuperação de senha e homologação completa dos importadores ainda pendentes. Cobrança PIX continua manual, sem integração automática. A validação de cadastro/login com conta temporária não substitui a homologação real de todos os papéis e fluxos.
