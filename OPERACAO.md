# Operação RHHub

Projeto isolado do United e KartEnduro, em /opt/rhhub.

A versão ativa é definida por RHHUB_RELEASE em /opt/rhhub/.deploy.env. Serviço rhhub-web, porta privada 127.0.0.1:18110, compose.production.yaml. Nginx do host e Certbot publicam HTTPS.

Antes de atualizar, preservar a versão ativa, suas configurações e assets. Testar a nova versão em uma porta local temporária; validar nginx -t, /health, rotas SPA, assets e HTTPS. Durante a troca, reter os assets com hash da versão anterior para clientes que ainda usam o HTML antigo.

Rollback: restaurar RHHUB_RELEASE para o diretório anterior e executar docker compose --env-file .deploy.env -p rhhub -f compose.production.yaml up -d. O primeiro deploy legado foi preservado como container rhhub-rollback-r1; só reativar depois de parar o container novo, para evitar colisão de porta.

Snapshots públicos em /var/backups/rhhub/public não substituem backup integral PostgreSQL/Auth/Storage. Os dados completos continuam no backend original. Nunca versionar .env, .private, senhas, dump de usuários ou arquivos privados.
