# Operação RHHub

Projeto isolado do United e KartEnduro, em /opt/rhhub.

A versão ativa é definida por RHHUB_RELEASE em /opt/rhhub/.deploy.env. Serviço rhhub-web, porta privada 127.0.0.1:18110, compose.production.yaml. Nginx do host e Certbot publicam HTTPS.

Antes de atualizar, preservar a versão ativa, suas configurações e assets. Testar a nova versão em uma porta local temporária; validar nginx -t, /health, rotas SPA, assets e HTTPS. Durante a troca, reter os assets com hash da versão anterior para clientes que ainda usam o HTML antigo.

Rollback: restaurar RHHUB_RELEASE para o diretório anterior e executar docker compose --env-file .deploy.env -p rhhub -f compose.production.yaml up -d. O primeiro deploy legado foi preservado como container rhhub-rollback-r1; só reativar depois de parar o container novo, para evitar colisão de porta.

Snapshots públicos em /var/backups/rhhub/public não substituem backup integral PostgreSQL/Auth/Storage. A exportação integral de tabelas e identidades foi preservada em /opt/rhhub/backup e /var/backups/rhhub/full, com acesso restrito ao root. Nunca versionar .env, .private, senhas, dump de usuários ou arquivos privados.

Backend isolado em /opt/rhhub/backend, projeto Compose rhhub-backend e gateway exclusivamente local em 127.0.0.1:18120. PostgreSQL, Auth, REST, Storage e funções executam na VPS. Configuração reproduzível em infra/backend; credenciais em .env.backend fora do Git. O frontend r3 ainda utiliza o backend original até concluir a cópia do único currículo e homologar a troca.

Validado no clone: contagens das 20 tabelas, oito usuários e identidades, hashes de senha preservados, isolamento de perfis, bloqueio de promoção administrativa e alterações de assinatura, upload/download privado e isolamento entre candidatos. Cadastro e login por senha também passaram com conta temporária, removida ao término. O healthcheck de Storage deve usar IPv4 127.0.0.1, pois o serviço não escuta no IPv6 localhost.
