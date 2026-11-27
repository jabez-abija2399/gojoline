#!/usr/bin/env bash
# Deploys GitHub main when it changed (every 5 minutes, gojoline-update.timer) or with --force
# (weekly, gojoline-refresh.timer, so security patches in the base images land without a push).
# Installed to /usr/local/sbin by setup.sh: a commit can't change the script that runs as root.
set -euo pipefail
exec 9>/run/gojoline-update.lock
flock -n 9 || exit 0

STATE=/var/lib/gojoline/deployed
mkdir -p /var/lib/gojoline
cd /opt/gojoline
git fetch --quiet origin main
TARGET=$(git rev-parse origin/main)
# Compare with what is actually running, so a failed build is retried on the next run.
if [ "${1:-}" != "--force" ] && [ "$(cat "$STATE" 2>/dev/null)" = "$TARGET" ]; then
  exit 0
fi
git reset --quiet --hard "$TARGET"
cd deploy/server
echo "$(date -u +%FT%TZ) deploying ${TARGET:0:7}"
# Build first, at low priority: the running version keeps serving until the new image is ready.
nice -n 10 ionice -c3 docker compose build --pull app runner renderer
# The site workspaces' image (template + packages); running workspaces pick it up when they restart.
nice -n 10 ionice -c3 docker build --pull -q -t gojoline-sandbox -f sandbox/Dockerfile ../../templates/site >/dev/null
docker compose pull --quiet caddy
docker compose up -d --remove-orphans
# Healthy within 2 minutes, or say so loudly in the journal (journalctl -u gojoline-update).
for _ in $(seq 1 24); do
  if docker compose exec -T app node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "$TARGET" > "$STATE"
    docker image prune -f >/dev/null
    docker builder prune -f --filter until=72h >/dev/null
    echo "$(date -u +%FT%TZ) live ${TARGET:0:7}"
    exit 0
  fi
  sleep 5
done
echo "$(date -u +%FT%TZ) DEPLOY FAILED: ${TARGET:0:7} is not healthy. Logs: docker compose logs --tail 100 app" >&2
exit 1
