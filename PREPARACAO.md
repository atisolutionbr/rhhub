# Implantação e revisão — 23/10/2026

Aplicação: https://rh.atisolution.com.br
Repositório: https://github.com/atisolutionbr/rhhub

## Revisão r2

- Build TypeScript/Vite aprovado. React Router 7 e Vite 7, ferramentas e dependências corrigidas; npm install auditou 152 pacotes e informou zero vulnerabilidades conhecidas.
- Nove testes automatizados aprovados: bloqueio de conteúdo privado sem perfil ou sem permissão, retorno seguro após login e regras de cache/offline.
- Login trata falhas de rede, espera o perfil e retorna à página solicitada ou ao painel correspondente. Cadastro exige oito caracteres e não esconde falha de login posterior.
- Cache offline restrito a conteúdo público; não intercepta login, painéis privados, APIs ou callbacks. Atualização de service worker sem cache permanente e limpeza restrita aos caches do próprio aplicativo.
- Gráficos da empresa mostram visualizações por vaga e distribuição real de status; números fictícios removidos.
- Pagamento: instrução manual por chave PIX, sem QR fictício nem promessa de ativação automática. Integração de cobrança automática não existe neste código.
- Nginx: assets versionados com cache longo, HTML e service worker revalidados, gzip e bloqueio de arquivos ocultos.
- Versões de produção geridas por compose.production.yaml, com imagem fixada por digest e logs limitados. Preservar a versão anterior para rollback.

## Dados

Snapshot privado local contém dados públicos visíveis via API: 5.028 vagas, 15 empresas, 48 tecnologias, 12 categorias, seis planos, 48 referências salariais e 20 rankings. Contagens conferidas. Não é um backup transacional nem inclui Auth, dados privados, Storage ou segredos.

Backend Bolt/Supabase original continua sendo utilizado. PostgreSQL, Auth, Storage e Edge Functions ainda não foram transferidos para a VPS.

A migração 021 protege os campos de privilégio em public.users e está preparada no repositório, mas NÃO aplicada ao backend original. A validação do tipo no create-user também continua pendente de implantação no backend. O ZIP inclui migrações históricas, não um dump de produção; não executar seeds sobre a base atual.

A transferência Claim para Supabase foi bloqueada pela revisão automática por falta de destino/plano definido e possível redução da proteção contra senhas vazadas no plano gratuito. A conta precisa ser criada/autenticada e o destino confirmado antes da exportação administrativa completa.

## Limites da validação

Validação pública não equivale à homologação autenticada completa de candidato, empresa, admin, importadores, pagamentos ou processamento de currículos. As funções originais e políticas de banco precisam de revisão e teste após obter acesso administrativo. Não desativar o backend original.
