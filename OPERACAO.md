# Operação RHHub — versão auditada em 24/10/2026

Frontend r8 em /opt/rhhub/releases/20261024-r8. Projeto isolado em /opt/rhhub; HTTPS /backend aponta para gateway privado 127.0.0.1:18120. PostgreSQL não expõe porta pública. Backend Compose rhhub-backend, frontend Compose rhhub na porta privada 18110. Credenciais permanecem em .env.backend, fora do Git.

RHHUB_RELEASE em /opt/rhhub/.deploy.env escolhe o frontend. Preservar as versões anteriores, testar a atualização em porta temporária e conferir nginx -t e /health. Não retornar a uma interface antiga que trate moeda estrangeira como BRL ou reexiba dados de demonstração.

## Coleta

Script /opt/rhhub/ingestion/sync_verified_jobs.py. rhhub-sync.timer verifica a fila a cada hora. Coletas completas de uma fonte têm intervalo mínimo de 12 horas; etapas interrompidas retomam depois do cooldown. HTTP 429 respeita Retry-After ou espera conservadora de 15 minutos. O checkpoint em /opt/rhhub/backup/verified-feeds/state.json contém próxima página, início do ciclo e horário mínimo. Não remover o checkpoint para contornar limites.

Consultar systemctl status rhhub-sync.timer e journalctl -u rhhub-sync.service. A ativação de uma fonte adicional no painel não implementa seu coletor: o serviço suporta as três fontes documentadas. Snapshots e relatórios ficam em /opt/rhhub/backup/verified-feeds, restritos ao root.

As páginas públicas usam live_jobs: somente publicados, data_verified, sem expiração e com conferência externa nas últimas 36 horas. A quarentena em rhhub_audit preserva os dados antigos e não é uma fila de anúncios a publicar. Nunca rodar seeds históricos em produção. Após restauração da exportação original, aplicar as migrações de proteção 021 a 027 antes de abrir a aplicação.

## Backups e testes

Exportação original privada em /opt/rhhub/backup; backups integrais em /var/backups/rhhub/full e /var/backups/rhhub/audit-20261024. Nunca versionar chaves, .env, .private, dados pessoais ou dumps. Para recuperar a base em operação, preferir o backup PostgreSQL posterior à auditoria, preservando credenciais de servidor e arquivos de Storage.

Em produção, usar somente tests/production-integrity.py, que é de leitura. Os testes de normalização não fazem chamadas externas. tests/portal-integration.py exige um backend local descartável e credenciais de staging; não publicar anúncios sintéticos para testar. O teste backend-smoke.py é histórico da cópia inicial, não representa as contagens atuais.

O binário de um currículo original segue pendente. SMTP de recuperação de senha e envio de alertas não estão configurados. Planos pagos e cobranças não estão disponíveis. Os três acessos solicitados permanecem com os papéis configurados; senhas não constam no repositório.
