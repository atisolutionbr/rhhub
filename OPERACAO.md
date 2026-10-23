# Operação RHHub

Projeto isolado em /opt/rhhub. Frontend r4 conecta ao backend próprio por https://rh.atisolution.com.br/backend. Gateway local 127.0.0.1:18120; banco sem porta pública. Backend Compose rhhub-backend em /opt/rhhub/backend. Credenciais em .env.backend, fora do Git.

Versão ativa definida por RHHUB_RELEASE em /opt/rhhub/.deploy.env. Frontend Compose rhhub, serviço rhhub-web, porta local 18110. Nginx do host e Certbot publicam HTTPS. Antes de atualizar, testar a versão em porta local temporária e preservar os assets anteriores.

Rollback: restaurar RHHUB_RELEASE para o diretório anterior e executar docker compose --env-file /opt/rhhub/.deploy.env -p rhhub -f /opt/rhhub/compose.production.yaml up -d. O arquivo .deploy.env.before-r4 preserva a versão anterior, ainda conectada ao backend original. Não remover as versões nem o original enquanto houver o currículo pendente.

Exportação completa e SQL de restauração privados em /opt/rhhub/backup. Backups restritos ao root em /var/backups/rhhub/full, incluindo pre-cutover-postgres.sql.gz conferido. Nunca versionar .env, .private, dumps de usuários, senhas ou arquivos privados.

Configuração em infra/backend. Após migrações do Auth, aplicar auth-claims.sql; após migrações do Storage, aplicar storage-policies.sql. roles.sql configura senhas internas e papéis necessários. Restaurar os dados com scripts/prepare-restore.py a partir das exportações privadas, sem executar seeds históricos. Aplicar migrações 021 e 022. Conferir com tests/backend-smoke.py no ambiente isolado antes de publicar. Healthcheck Storage usa 127.0.0.1 para evitar resolução IPv6.

O único currículo original tem referência preservada, mas o binário continua pendente. SMTP de recuperação de senha, importadores e cobrança automática requerem configuração/homologação adicional. As senhas existentes não foram redefinidas.
