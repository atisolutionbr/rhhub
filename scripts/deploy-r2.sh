#!/usr/bin/env bash
set -Eeuo pipefail
release=/opt/rhhub/releases/20261023-r2
image=nginx:stable-alpine@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951
test ! -e "$release"
test -d /opt/rhhub/dist
test -z "$(ss -ltn 'sport = :18111' | tail -n +2)"
install -d -m 755 "$release"
tar -xzf /tmp/rhhub-release-20261023-r2.tgz -C "$release"
# Keep previous hashed assets for clients with an earlier HTML/app shell.
cp -an /opt/rhhub/dist/assets/. "$release/dist/assets/"
docker run --rm -d --name rhhub-check-r2 -p 127.0.0.1:18111:80 \
  -v "$release/dist:/usr/share/nginx/html:ro" \
  -v "$release/infra/nginx.conf:/etc/nginx/conf.d/default.conf:ro" "$image"
trap 'docker stop rhhub-check-r2 >/dev/null 2>&1 || true' EXIT
docker exec rhhub-check-r2 nginx -t
for attempt in $(seq 1 10); do
  if curl -fsS http://127.0.0.1:18111/health; then break; fi
  sleep 1
done
curl -fsS http://127.0.0.1:18111/health
curl -fsS http://127.0.0.1:18111/admin >/dev/null
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:18111/assets/missing.js)" = 404
curl -fsSI http://127.0.0.1:18111/sw.js | grep -i 'cache-control:.*no-store'
install -d -m 700 /var/backups/rhhub/public
install -m 600 /tmp/rhhub-public-data-20261023.tgz /var/backups/rhhub/public/20261023.tgz
cp -a /etc/nginx/sites-available/rh.atisolution.com.br /var/backups/rhhub/nginx-before-r2.conf
cp "$release/compose.production.yaml" /opt/rhhub/compose.production.yaml
printf 'RHHUB_RELEASE=%s\n' "$release" > /opt/rhhub/.deploy.env
docker compose --env-file /opt/rhhub/.deploy.env -p rhhub -f /opt/rhhub/compose.production.yaml config -q
docker stop rhhub-check-r2
trap - EXIT
docker stop rhhub-web
docker rename rhhub-web rhhub-rollback-r1
if docker compose --env-file /opt/rhhub/.deploy.env -p rhhub -f /opt/rhhub/compose.production.yaml up -d && sleep 2 && curl -fsS http://127.0.0.1:18110/health; then
  nginx -t
  curl -fsSI https://rh.atisolution.com.br/
  printf '\nDEPLOY_R2_OK\n'
else
  docker compose --env-file /opt/rhhub/.deploy.env -p rhhub -f /opt/rhhub/compose.production.yaml down
  docker rename rhhub-rollback-r1 rhhub-web
  docker start rhhub-web
  printf '\nDEPLOY_R2_ROLLED_BACK\n' >&2
  exit 1
fi
